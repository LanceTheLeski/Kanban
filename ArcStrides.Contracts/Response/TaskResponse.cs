namespace ArcStrides.Contracts.Response;

public class TaskResponse
{
    public Guid? ID { get; init; } = null;

    public Guid? BoardID { get; init; } = null;

    public string? Title { get; init; } = null;

    public int? TaskTypeID { get; init; } = null;

    public string? TaskTypeTitle { get; init; } = null;

    public bool? isCompleted { get; init; } = null;
}