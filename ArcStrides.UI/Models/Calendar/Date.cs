using ArcStrides.UI.Models.Board;
using MudBlazor;

namespace ArcStrides.UI.Models.Calendar;

public class Date
{
    public Guid? ID { get; set; }

    public int? DateOrder { get; set; }

    public int? WeekOrder { get; set; }

    public int? DayOfTheWeekOrder { get; set; }

    public string? Month { get; set; }

    public int? Year { get; set; }

    public IEnumerable<Card>? Cards { get; set; }

    /// <summary>
    /// The sum of all the different task types for the day.
    /// </summary>
    public double [] DonutChartData { get; set; }

    /// <summary>
    /// A list of multiple ChartSeries. Each ChartSeries tracks how many tasks 
    /// have been completed out of the total for a single task type for the day.The 
    /// collection holds the completion data for all tasks, sorted by type, for a 
    /// single day - giving a full picture of everything completed in the grand scheme 
    /// of things.
    /// </summary>
    public List<ChartSeries> LineChartData { get; set; }

    /// <summary>
    /// Labels are required to assign on the donut chart. They will correspond to all 
    /// of the task types for the day.
    /// </summary>
    public string [] Labels { get; set; }

    /// <summary>
    /// The x-axis labels should correspond to task type of the line chart. (I think??)
    /// </summary>
    public string [] xAxisLabels { get; set; }
}