namespace ArcStrides.Contracts.Response;

public class CardResponse
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;

    public string? Description { get; init; } = null;

    public CardPositionResponse? Position { get; init; } = null;

    public IEnumerable<TaskResponse>? Tasks { get; init; } = null;

    public TimelineResponse? Timeline { get; init; } = null;

    public IEnumerable<TagResponse>? Tags { get; init; } = null;
}