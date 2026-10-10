namespace ArcStrides.Contracts.Response;

public class CalendarOptionsResponse
{
    /// <summary>
    /// The weekend's days, from Sunday as 0.
    /// </summary>
    public IEnumerable<int>? WeekendDays { get; init; } = null;

    /// <summary>
    /// What a weekend day is when it has no type of its own; 0 for none.
    /// </summary>
    public int? WeekendDateTypeID { get; init; } = null;

    /// <summary>
    /// What any other day is when it has no type of its own; 0 for none.
    /// </summary>
    public int? WeekdayDateTypeID { get; init; } = null;

    /// <summary>
    /// What has been changed about each kind of day. A kind not listed is as the
    /// UI defines it.
    /// </summary>
    public IEnumerable<DateTypeOptionsResponse>? DateTypes { get; set; } = null;
}
