namespace ArcStrides.Func.Sync.Models;

public record DriveFileInfo(
    string  Id,
    string  Name,
    string  MimeType,
    string? ParentId,
    long?   Size,
    string  ResolvedLocalPath
);
