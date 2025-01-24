namespace ArcStrides.Contracts.Response;

public class MonthResponse
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;

    public IEnumerable<DateResponse>? Dates { get; init; } = null;
}