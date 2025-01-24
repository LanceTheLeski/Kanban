namespace ArcStrides.Contracts.Request.Patch;

public class ColumnPatchRequest
{
    public string? Title { get; init; } = null;

    public int? Order { get; init; } = null;
}