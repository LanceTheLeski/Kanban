namespace ArcStrides.Contracts.Request.Create;

public class DateCreateRequest
{
    public byte? DateOrder { get; init; } = null; // Is the date itself - e.g. The 15th

    public byte? WeekOrder { get; init; } = null; // Is the numbered week - e.g The 2nd week

    public byte? DayOfTheWeekOrder { get; init; } = null; // Is the day of the week starting with Sunday as 0 - e.g. The 6th day of the week (Saturday; zero-based)

    public byte? MonthOrder { get; init; } = null;

    public string? MonthName { get; init; } = null;

    public int? Year { get; init; } = null;
}