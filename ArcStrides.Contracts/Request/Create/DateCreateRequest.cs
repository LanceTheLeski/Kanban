namespace ArcStrides.Contracts.Request.Create;

public class DateCreateRequest
{
    public byte DateOrder { get; set; } // Is the date itself - e.g. The 15th

    public byte WeekOrder { get; set; } // Is the numbered week - e.g The 2nd week

    public byte DayOfTheWeekOrder { get; set; } // Is the day of the week starting with Sunday as 0 - e.g. The 6th day of the week (Saturday; zero-based)

    public byte MonthOrder { get; set; }

    public string MonthName { get; set; }

    public int Year { get; set; }

    public Guid MonthID { get; set; }
}