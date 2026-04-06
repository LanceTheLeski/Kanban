using ArcStrides.Func.Sync.Models;
using ArcStrides.Func.Sync.Options;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;
using System.Net;

namespace ArcStrides.Func.Sync.Services;

public sealed class GoogleDriveService : IGoogleDriveService
{
    private static readonly string[] DriveScopes = [DriveService.Scope.Drive];

    // Google Workspace MIME types that must be exported rather than downloaded directly.
    // Maps google-apps MIME type → (export MIME type, file extension).
    private static readonly Dictionary<string, (string ExportMime, string Extension)> ExportMap = new()
    {
        ["application/vnd.google-apps.document"]     = ("application/vnd.openxmlformats-officedocument.wordprocessingml.document",   ".docx"),
        ["application/vnd.google-apps.spreadsheet"]  = ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",         ".xlsx"),
        ["application/vnd.google-apps.presentation"] = ("application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx"),
        ["application/vnd.google-apps.form"]         = ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",         ".xlsx"),
        ["application/vnd.google-apps.drawing"]      = ("application/pdf",                                                           ".pdf"),
        ["application/vnd.google-apps.site"]         = ("application/pdf",                                                           ".pdf"),
        ["application/vnd.google-apps.script"]       = ("application/vnd.google-apps.script+json",                                   ".json"),
    };

    // Types that are structural or unsupported for download — always skip.
    private static readonly HashSet<string> SkipTypes =
    [
        "application/vnd.google-apps.folder",
        "application/vnd.google-apps.shortcut",
    ];

    private readonly DriveService            _drive;
    private readonly SyncOptions             _syncOptions;
    private readonly ILogger<GoogleDriveService> _logger;
    private readonly ResiliencePipeline      _retry;

    // Populated once per ListAllFilesAsync call; maps Drive folder ID → relative local path.
    private readonly Dictionary<string, string> _folderPathCache = new();

    public GoogleDriveService(
        IOptions<GoogleDriveOptions> driveOptions,
        IOptions<SyncOptions>        syncOptions,
        ILogger<GoogleDriveService>  logger)
    {
        _syncOptions = syncOptions.Value;
        _logger      = logger;
        _drive       = BuildDriveService(driveOptions.Value);
        _retry       = BuildRetryPipeline();
    }

    // -------------------------------------------------------------------------
    // Public interface
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<DriveFileInfo>> ListAllFilesAsync(CancellationToken ct)
    {
        _folderPathCache.Clear();
        await BuildFolderCacheAsync(ct);

        var files    = new List<DriveFileInfo>();
        string? pageToken = null;

        do
        {
            var request = _drive.Files.List();
            request.Q                         = "mimeType != 'application/vnd.google-apps.folder' and trashed = false";
            request.Fields                    = "nextPageToken, files(id, name, mimeType, parents, size)";
            request.PageSize                  = 1000;
            request.PageToken                 = pageToken;
            request.IncludeItemsFromAllDrives = true;
            request.SupportsAllDrives         = true;

            var result = await _retry.ExecuteAsync(async ct2 => await request.ExecuteAsync(ct2), ct);
            pageToken  = result.NextPageToken;

            foreach (var f in result.Files ?? [])
            {
                if (SkipTypes.Contains(f.MimeType))
                    continue;

                var parentId  = f.Parents?.FirstOrDefault();
                var localPath = ResolveLocalPath(f.Id, f.Name, f.MimeType, parentId);

                files.Add(new DriveFileInfo(
                    Id:                f.Id,
                    Name:              f.Name,
                    MimeType:          f.MimeType,
                    ParentId:          parentId,
                    Size:              f.Size,
                    ResolvedLocalPath: localPath));
            }
        }
        while (pageToken is not null);

        _logger.LogInformation("Listed {Count} files from Drive", files.Count);
        return files;
    }

    public async Task DownloadFileAsync(DriveFileInfo file, CancellationToken ct)
    {
        EnsureDirectory(file.ResolvedLocalPath);

        var request = _drive.Files.Get(file.Id);
        request.SupportsAllDrives = true;

        await using var stream = new FileStream(
            file.ResolvedLocalPath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize: 81_920, useAsync: true);

        var progress = await request.DownloadAsync(stream, ct);

        if (progress.Status == Google.Apis.Download.DownloadStatus.Failed)
            throw new IOException($"Download failed for '{file.Name}': {progress.Exception?.Message}");

        _logger.LogDebug("Downloaded '{Name}' → {Path}", file.Name, file.ResolvedLocalPath);
    }

    public async Task<bool> ExportFileAsync(DriveFileInfo file, CancellationToken ct)
    {
        if (!ExportMap.TryGetValue(file.MimeType, out var exportInfo))
        {
            _logger.LogWarning("No export mapping for MIME type '{Mime}' on file '{Name}' — skipping", file.MimeType, file.Name);
            return false;
        }

        EnsureDirectory(file.ResolvedLocalPath);

        var request = _drive.Files.Export(file.Id, exportInfo.ExportMime);

        await using var stream = new FileStream(
            file.ResolvedLocalPath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize: 81_920, useAsync: true);

        try
        {
            var progress = await request.DownloadAsync(stream, ct);

            if (progress.Status == Google.Apis.Download.DownloadStatus.Failed)
            {
                var ex = progress.Exception;
                if (ex?.Message.Contains("exportSizeLimitExceeded", StringComparison.OrdinalIgnoreCase) == true
                    || ex?.Message.Contains("403", StringComparison.OrdinalIgnoreCase) == true)
                {
                    _logger.LogWarning("Export size limit exceeded for '{Name}' ({Id}) — skipping", file.Name, file.Id);
                    await stream.DisposeAsync();
                    SafeDelete(file.ResolvedLocalPath);
                    return false;
                }

                throw new IOException($"Export failed for '{file.Name}': {ex?.Message}");
            }
        }
        catch (Google.GoogleApiException ex) when ((int)ex.HttpStatusCode == 403)
        {
            _logger.LogWarning("Export forbidden (size limit) for '{Name}' ({Id}): {Msg}", file.Name, file.Id, ex.Message);
            await stream.DisposeAsync();
            SafeDelete(file.ResolvedLocalPath);
            return false;
        }

        _logger.LogDebug("Exported '{Name}' → {Path}", file.Name, file.ResolvedLocalPath);
        return true;
    }

    public async Task<bool> DeleteFileAsync(string fileId, CancellationToken ct)
    {
        try
        {
            await _retry.ExecuteAsync(async ct2 =>
            {
                var req = _drive.Files.Delete(fileId);
                req.SupportsAllDrives = true;
                await req.ExecuteAsync(ct2);
            }, ct);

            return true;
        }
        catch (Google.GoogleApiException ex) when ((int)ex.HttpStatusCode == 403)
        {
            _logger.LogWarning("Delete forbidden for file {Id} (not owned): {Msg}", fileId, ex.Message);
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private DriveService BuildDriveService(GoogleDriveOptions opts)
    {
        var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId     = opts.ClientId,
                ClientSecret = opts.ClientSecret,
            },
            Scopes = DriveScopes,
        });

        var token      = new TokenResponse { RefreshToken = opts.RefreshToken };
        var credential = new UserCredential(flow, "user", token);

        return new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName       = "ArcStrides.Func.Sync",
        });
    }

    private ResiliencePipeline BuildRetryPipeline()
    {
        return new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                ShouldHandle = new PredicateBuilder()
                    .Handle<Google.GoogleApiException>(ex =>
                        (int)ex.HttpStatusCode == 429
                        || ex.HttpStatusCode == HttpStatusCode.ServiceUnavailable
                        || ex.HttpStatusCode == HttpStatusCode.InternalServerError)
                    .Handle<IOException>(),
                MaxRetryAttempts = 5,
                Delay            = TimeSpan.FromSeconds(2),
                BackoffType      = DelayBackoffType.Exponential,
                UseJitter        = true,
                OnRetry          = args =>
                {
                    _logger.LogWarning("Retry {Attempt} after {Delay:g}: {Msg}",
                        args.AttemptNumber + 1, args.RetryDelay, args.Outcome.Exception?.Message);
                    return ValueTask.CompletedTask;
                }
            })
            .Build();
    }

    /// <summary>
    /// Phase 1 of path resolution: enumerate all Drive folders once and build
    /// a cache mapping folder ID → relative folder path (e.g. "Projects/2024").
    /// Uses BFS top-down from the Drive root so each folder is resolved exactly once
    /// with no recursive API calls.
    /// </summary>
    private async Task BuildFolderCacheAsync(CancellationToken ct)
    {
        // Collect all folders from Drive.
        var rawFolders = new Dictionary<string, (string Name, string? ParentId)>();
        string? pageToken = null;

        do
        {
            var request = _drive.Files.List();
            request.Q                         = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
            request.Fields                    = "nextPageToken, files(id, name, parents)";
            request.PageSize                  = 1000;
            request.PageToken                 = pageToken;
            request.IncludeItemsFromAllDrives = true;
            request.SupportsAllDrives         = true;

            var result = await _retry.ExecuteAsync(async ct2 => await request.ExecuteAsync(ct2), ct);
            pageToken  = result.NextPageToken;

            foreach (var f in result.Files ?? [])
                rawFolders[f.Id] = (f.Name, f.Parents?.FirstOrDefault());
        }
        while (pageToken is not null);

        // Identify the Drive root: its parent is absent from the folder set, or it has no parent.
        string? rootId = rawFolders
            .Where(kv => kv.Value.ParentId is null || !rawFolders.ContainsKey(kv.Value.ParentId))
            .Select(kv => (string?)kv.Key)
            .FirstOrDefault();

        if (rootId is null)
        {
            _logger.LogWarning("Could not identify Drive root folder; folder paths may be incorrect");
            return;
        }

        // BFS: assign paths top-down so every parent is resolved before its children.
        _folderPathCache[rootId] = string.Empty;

        var queue = new Queue<string>();
        queue.Enqueue(rootId);

        while (queue.Count > 0)
        {
            var parentId   = queue.Dequeue();
            var parentPath = _folderPathCache[parentId];

            foreach (var (childId, (childName, childParentId)) in rawFolders)
            {
                if (childParentId != parentId || _folderPathCache.ContainsKey(childId))
                    continue;

                _folderPathCache[childId] = parentPath.Length == 0
                    ? SanitizeName(childName)
                    : parentPath + Path.DirectorySeparatorChar + SanitizeName(childName);

                queue.Enqueue(childId);
            }
        }

        _logger.LogDebug("Folder cache built: {Count} entries", _folderPathCache.Count);
    }

    /// <summary>
    /// Phase 2: given a file's parent ID, produce the full absolute local path
    /// including filename and extension.
    /// </summary>
    private string ResolveLocalPath(string fileId, string fileName, string mimeType, string? parentId)
    {
        string folderRelPath = string.Empty;

        if (parentId is not null && !_folderPathCache.TryGetValue(parentId, out folderRelPath!))
        {
            _logger.LogWarning("Parent folder {ParentId} not in cache for file '{Name}' — placing at root", parentId, fileName);
            folderRelPath = string.Empty;
        }

        // Determine extension: export map for Workspace types, original extension for binaries.
        string extension;
        string baseName;

        if (mimeType.StartsWith("application/vnd.google-apps.", StringComparison.Ordinal)
            && ExportMap.TryGetValue(mimeType, out var exportInfo))
        {
            extension = exportInfo.Extension;
            baseName  = SanitizeName(Path.GetFileNameWithoutExtension(fileName));
        }
        else
        {
            extension = Path.GetExtension(fileName);
            baseName  = SanitizeName(Path.GetFileNameWithoutExtension(fileName));
        }

        var dir      = Path.Combine(_syncOptions.LocalOutputPath, folderRelPath);
        var localPath = Path.Combine(dir, baseName + extension);

        // Disambiguate collisions by appending the Drive file ID.
        if (File.Exists(localPath))
            localPath = Path.Combine(dir, baseName + "_" + fileId + extension);

        return localPath;
    }

    private static string SanitizeName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        return string.Concat(name.Select(c => invalid.Contains(c) ? '_' : c));
    }

    private static void EnsureDirectory(string filePath)
    {
        var dir = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);
    }

    private static void SafeDelete(string path)
    {
        try { if (File.Exists(path)) File.Delete(path); }
        catch { /* best-effort cleanup of partial files */ }
    }
}
