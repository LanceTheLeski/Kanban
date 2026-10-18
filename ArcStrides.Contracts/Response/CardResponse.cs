namespace ArcStrides.Contracts.Response;

public class CardResponse
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;

    public string? Description { get; init; } = null;

    /// <summary>
    /// Whether the card keeps dates of its own rather than taking its tasks'; null
    /// when it was never set. See Card.OverridesTaskTimelines.
    /// </summary>
    public bool? OverridesTaskTimelines { get; init; } = null;

    public CardPositionResponse? Position { get; set; } = null; //This line differs

    public IEnumerable<TaskResponse>? Tasks { get; set; } = null;

    public TimelineResponse? Timeline { get; set; } = null;

    /// <summary>
    /// The tags on the card. Filled in by every read that sends cards: the board,
    /// and the calendar's month.
    /// </summary>
    public IEnumerable<TagResponse>? Tags { get; set; } = null;
}