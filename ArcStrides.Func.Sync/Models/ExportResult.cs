namespace ArcStrides.Func.Sync.Models;

public enum ExportOutcome
{
    Downloaded,
    Exported,
    Skipped_TooLarge,
    Skipped_DeleteForbidden,
    Skipped_UnsupportedType,
    Failed
}

public record ExportResult(string FileId,
                           string FileName,
                           ExportOutcome Outcome,
                           string? ErrorMessage = null);