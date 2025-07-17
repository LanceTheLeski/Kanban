using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Calendar;

/// <summary>
/// Loosely corresponds to a day within a month.
/// </summary>
[ArcTableName ("Dates")]
public class Date : ArcCalendarsEntity
{
    /// <summary>
    /// IDK???
    /// </summary>
    public override string RowKey { get; set; }

    /// <summary>
    /// Is the date itself - e.g. The 15th day of the month.
    /// </summary>
    public int DateOrder { get; set; }

    /// <summary>
    /// Is the numbered week - e.g The 2nd week.
    /// </summary>
    public int WeekOrder { get; set; }

    /// <summary>
    /// The day of the week starting with Sunday as 0 - e.g. The 6th day of the week (Saturday; zero-based).
    /// </summary>
    public int DayOfTheWeekOrder { get; set; }

    /// <summary>
    /// The month of the year starting with January as 0 - e.g. The 11th month of the year (December; zero-based).
    /// </summary>
    public int MonthOrder { get; set; }

    /// <summary>
    /// The name of the month this year resides under.
    /// </summary>
    public string MonthName { get; set; }

    /// <summary>
    /// The year in which this day resides in.
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Links to a group of Cards.
    /// </summary>
    public Guid CardTagGroupID { get; set; }
}