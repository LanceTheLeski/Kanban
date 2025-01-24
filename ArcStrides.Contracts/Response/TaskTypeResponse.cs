namespace ArcStrides.Contracts.Response;

public class TaskTypeResponse
{
    public int? ID { get; init; } = null;

    public Guid? GroupTagID { get; init; } = null;

    public string? Title { get; init; } = null;
}