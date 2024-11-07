using Kanban.Contracts.Response;
using MudBlazor;

namespace Kanban.UI.Models;

public class Date
{
    // 0 = Sunday
    // 1 = Monday
    // 2 = Tuesday
    // 3 = Wednesday
    // 4 = Thursday
    // 5 = Friday
    // 6 = Saturday
    public class Month()
    {
        public int DaysInMonth { get; set; }

        public int FirstDayIndex { get; set; }

        public List<Week> Weeks { get; set; }
    }

    public class Week()
    {
        public Day Sunday { get; set; }
        public Day Monday { get; set; }
        public Day Tuesday { get; set; }
        public Day Wednesday { get; set; }
        public Day Thursday { get; set; }
        public Day Friday { get; set; }
        public Day Saturday { get; set; }
    }

    public class Day()
    {
        public int DayOfTheMonth { get; set; }

        public bool IsFromDifferentMonth { get; set; } = false;

        public List<MonthResponse.BasicCard> Cards { get; set; }

        /// <summary>
        /// Task Total
        /// </summary>
        public double[] DonutChartData { get; set; }

        /// <summary>
        /// Tasks completed out of total expected to be completed by task group
        /// </summary>
        public List<ChartSeries> LineChartData { get; set; }

        public string[] Labels { get; set; }

        public string[] xAxisLabels { get; set; }
    }
}