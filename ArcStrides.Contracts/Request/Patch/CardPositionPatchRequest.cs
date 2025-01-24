namespace ArcStrides.Contracts.Request.Patch;

public class CardPositionPatchRequest
{
    public string? Title { get; init; } = null;

    public string? Description { get; init; } = null;

    public Guid? ColumnID { get; init; } = null;

    public string? ColumnTitle { get; init; } = null;

    public int? ColumnOrder { get; init; } = null;

    public Guid? SwimlaneID { get; init; } = null;

    public string? SwimlaneTitle { get; init; } = null;

    public int? SwimlaneOrder { get; init; } = null;
}