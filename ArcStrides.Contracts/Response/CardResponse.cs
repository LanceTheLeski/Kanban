namespace ArcStrides.Contracts.Response;

public class CardResponse
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;

    public string? Description { get; init; } = null;

    public CardPositionResponse? Position { get; set; } = null; //This line differs

    public IEnumerable<TaskResponse>? Tasks { get; set; } = null;

    public TimelineResponse? Timeline { get; set; } = null;

    public IEnumerable<TagResponse>? Tags { get; set; } = null;
}