namespace ArcStrides.Contracts.Response;

public class DateResponse
{
    public Guid? ID { get; init; } = null;

    public int? DateOrder { get; init; } = null;

    public int? WeekOrder { get; init; } = null;

    public int? DayOfTheWeekOrder { get; init; } = null;

    public string? MonthName { get; init; } = null;

    public int? YearOrder { get; init; } = null;

    /// <summary>
    /// What kind of day this is; 0 for none chosen.
    /// </summary>
    public int? DateTypeID { get; init; } = null;

    public IEnumerable<CardResponse>? Cards { get; set; } = null;
}