namespace ArcStrides.Contracts.Response;

public class DateResponse
{
    public Guid? ID { get; init; } = null;

    public int? DateOrder { get; init; } = null;

    public int? WeekOrder { get; init; } = null;

    public int? DayOfTheWeekOrder { get; init; } = null;

    public IEnumerable<CardResponse>? Cards { get; init; } = null;
}