namespace ArcStrides.Contracts.Request.Patch;

public class TaskPatchRequest
{
    public string? Title { get; init; } = null;

    public int? TypeID { get; init; } = null;

    public int? Order { get; init; } = null;

    public bool? IsComplete { get; init; } = null;

    public Guid? TimelineID { get; init; } = null;
}