using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Calendar;

/// <summary>
/// What someone has changed about one kind of day: its picture, whether its
/// progress lines show, and the task type new tasks on it start as.
/// </summary>
/// <remarks>
/// The kinds themselves — Work, Leisure, Vacation — are defined by the UI, which
/// draws them (Calendar.DayTypes.ts); see <see cref="Date.DateTypeID"/>. This holds
/// only what has been changed from that, one row per kind, keyed by the type's
/// number under the calendar's <see cref="Guid.Empty"/>. A kind with no row is as
/// the UI defines it.
/// </remarks>
[ArcTableName ("DateTypeOptions")]
public class DateTypeOptions : ArcCalendarsEntity
{
    /// <summary>
    /// The type's number, as <see cref="Date.DateTypeID"/> stores it.
    /// </summary>
    public override string RowKey { get; set; }

    /// <summary>
    /// The picture it is drawn with, by the UI's name for it ("city", "park",
    /// "beach"), or empty for none.
    /// </summary>
    public string? Scene { get; set; }

    /// <summary>
    /// Whether a day of this kind shows its progress lines.
    /// </summary>
    public bool ShowsProgress { get; set; }

    /// <summary>
    /// The task type a new task on a day of this kind starts as; null for none.
    /// </summary>
    public int? DefaultTaskTypeID { get; set; }
}
