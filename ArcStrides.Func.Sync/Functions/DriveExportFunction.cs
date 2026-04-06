using ArcStrides.Func.Sync.Models;
using ArcStrides.Func.Sync.Options;
using ArcStrides.Func.Sync.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Text.Json;

namespace ArcStrides.Func.Sync.Functions;

public class DriveExportFunction
{
    private readonly IGoogleDriveService          _driveService;
    private readonly SyncOptions                  _syncOptions;
    private readonly ILogger<DriveExportFunction> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = true };

    private const string GoogleAppsMimePrefix = "application/vnd.google-apps.";

    public DriveExportFunction(
        IGoogleDriveService          driveService,
        IOptions<SyncOptions>        syncOptions,
        ILogger<DriveExportFunction> logger)
    {
        _driveService = driveService;
        _syncOptions  = syncOptions.Value;
        _logger       = logger;
    }

    [Function("DriveExport")]
    public async Task<HttpResponseData> RunAsync(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "drive/export")]
        HttpRequestData   req,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Drive export started. Output path: {Path}", _syncOptions.LocalOutputPath);

        var summary = new SyncSummary();

        try
        {
            var allFiles = await _driveService.ListAllFilesAsync(cancellationToken);
            summary.TotalDiscovered = allFiles.Count;
            _logger.LogInformation("Discovered {Count} files", allFiles.Count);

            using var semaphore = new SemaphoreSlim(_syncOptions.MaxConcurrentDownloads);

            await Task.WhenAll(allFiles.Select(file =>
                ProcessFileAsync(file, summary, semaphore, cancellationToken)));
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Drive export was cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Drive export failed with an unhandled exception");

            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteStringAsync(ex.Message, cancellationToken);
            return errorResponse;
        }

        _logger.LogInformation(
            "Drive export complete — Downloaded: {Downloaded}, Exported: {Exported}, " +
            "SkippedTooLarge: {SkippedTooLarge}, SkippedUnsupported: {SkippedUnsupported}, " +
            "DeletesForbidden: {DeletesForbidden}, Failed: {Failed}",
            summary.Downloaded, summary.Exported,
            summary.SkippedTooLarge, summary.SkippedUnsupported,
            summary.DeletesForbidden, summary.Failed);

        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json");
        await response.WriteStringAsync(JsonSerializer.Serialize(summary, JsonOpts), cancellationToken);
        return response;
    }

    private async Task ProcessFileAsync(
        DriveFileInfo    file,
        SyncSummary      summary,
        SemaphoreSlim    semaphore,
        CancellationToken ct)
    {
        await semaphore.WaitAsync(ct);
        try
        {
            var isWorkspace = file.MimeType.StartsWith(GoogleAppsMimePrefix, StringComparison.Ordinal);

            if (isWorkspace)
            {
                var exported = await _driveService.ExportFileAsync(file, ct);

                if (!exported)
                {
                    summary.IncrementSkippedTooLarge();
                    _logger.LogWarning("Skipped (export failed): '{Name}' ({Id})", file.Name, file.Id);
                    return; // Do NOT delete — file was not saved locally.
                }

                summary.IncrementExported();
            }
            else
            {
                await _driveService.DownloadFileAsync(file, ct);
                summary.IncrementDownloaded();
            }

            // Delete from Drive only after a confirmed local save.
            var deleted = await _driveService.DeleteFileAsync(file.Id, ct);
            if (!deleted)
            {
                summary.IncrementDeletesForbidden();
                _logger.LogWarning("Delete skipped (not owned): '{Name}' ({Id})", file.Name, file.Id);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            summary.IncrementFailed();
            var msg = $"{file.Name} ({file.Id}): {ex.Message}";
            lock (summary.Errors) { summary.Errors.Add(msg); }
            _logger.LogError(ex, "Failed to process file '{Name}' ({Id})", file.Name, file.Id);
        }
        finally
        {
            semaphore.Release();
        }
    }
}
