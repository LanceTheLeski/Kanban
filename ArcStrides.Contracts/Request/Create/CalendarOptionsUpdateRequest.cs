namespace ArcStrides.Contracts.Request.Create;

/// <summary>
/// Every calendar option at once — <c>PUT calendars/options</c>. What is sent is
/// what is kept: a kind of day left out of DateTypes goes back to the UI's own
/// definition.
/// </summary>
public class CalendarOptionsUpdateRequest
{
    /// <summary>
    /// The weekend's days, from Sunday as 0. May be empty: a week with no weekend.
    /// </summary>
    public IEnumerable<int>? WeekendDays { get; init; } = null;

    public int? WeekendDateTypeID { get; init; } = null;

    public int? WeekdayDateTypeID { get; init; } = null;

    public IEnumerable<DateTypeOptionsUpdateRequest>? DateTypes { get; init; } = null;
}
