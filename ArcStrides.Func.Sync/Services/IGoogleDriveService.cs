using ArcStrides.Func.Sync.Models;

namespace ArcStrides.Func.Sync.Services;

public interface IGoogleDriveService
{
    /// <summary>
    /// Builds the folder-path cache then returns every non-folder file in Drive
    /// with its fully resolved local path pre-populated.
    /// </summary>
    Task<IReadOnlyList<DriveFileInfo>> ListAllFilesAsync(CancellationToken ct);

    /// <summary>
    /// Downloads a binary file from Drive, streaming directly to disk.
    /// </summary>
    Task DownloadFileAsync(DriveFileInfo file, CancellationToken ct);

    /// <summary>
    /// Exports a Google Workspace native file to its mapped Office/PDF format.
    /// Returns false if the export fails due to the 10 MB size cap (HTTP 403).
    /// </summary>
    Task<bool> ExportFileAsync(DriveFileInfo file, CancellationToken ct);

    /// <summary>
    /// Permanently deletes a file from Drive.
    /// Returns false (does not throw) when the caller lacks delete permission
    /// because they do not own the file.
    /// </summary>
    Task<bool> DeleteFileAsync(string fileId, CancellationToken ct);
}
