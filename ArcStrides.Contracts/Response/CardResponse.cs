namespace ArcStrides.Contracts.Response;

public class CardResponse
{
    public Guid ID { get; set; } = Guid.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<TaskResponse>? Tasks { get; set; } = null;

    public TimelineResponse? Timeline { get; set; } = null;

    public List<TagResponse>? Tags { get; set; } = null;
}