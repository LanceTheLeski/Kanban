namespace ArcStrides.Contracts.Response;

public class TaskResponse
{
    public Guid? ID { get; init; } = null;

    public Guid? BoardID { get; init; } = null;

    public string? Title { get; init; } = null;

    public TaskTypeResponse? TaskType { get; set; } = null;

    public int? Order { get; set; } = null;

    public TimelineResponse? Timeline { get; set; } = new TimelineResponse ();

    public bool? IsComplete { get; init; } = null;
}