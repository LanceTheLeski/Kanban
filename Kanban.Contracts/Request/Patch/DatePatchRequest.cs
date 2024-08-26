namespace Kanban.Contracts.Request.Patch;

public class DatePatchRequest
{
    public int DateOrder { get; set; } // Is the date itself - e.g. The 15th

    public int WeekOrder { get; set; } // Is the numbered week - e.g The 2nd week

    public int DayOfTheWeekOrder { get; set; } // Is the day of the week starting with Sunday as 0 - e.g. The 6th day of the week (Saturday; zero-based)

    public int MonthOrder { get; set; }

    public string MonthName { get; set; }

    public int Year { get; set; }
}