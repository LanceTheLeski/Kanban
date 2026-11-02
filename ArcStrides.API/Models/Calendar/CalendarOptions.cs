using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Calendar;

/// <summary>
/// How the calendar treats a day nobody has given a type: which days of the week
/// are the weekend, and what kind of day each half of the week is by default.
/// </summary>
/// <remarks>
/// One row. There is one calendar, so its PartitionKey is <see cref="Guid.Empty"/>,
/// as is its RowKey; when calendars have IDs of their own, this is keyed by one.
/// No row means the defaults: Saturday and Sunday, both of no type.
/// </remarks>
[ArcTableName ("CalendarOptions")]
public class CalendarOptions : ArcCalendarsEntity
{
    public override string RowKey { get; set; }

    /// <summary>
    /// The weekend's days, as day-of-week numbers from Sunday as 0, joined with
    /// commas: "0,6". A table row holds no lists.
    /// </summary>
    public string WeekendDays { get; set; } = "0,6";

    /// <summary>
    /// What a weekend day is when it has no type of its own. 0 is none.
    /// </summary>
    public int WeekendDateTypeID { get; set; }

    /// <summary>
    /// What any other day is when it has no type of its own. 0 is none.
    /// </summary>
    public int WeekdayDateTypeID { get; set; }
}
