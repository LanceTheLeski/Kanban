using Azure.Data.Tables;
using Azure;

namespace Kanban.API.Models;

/// <summary>
/// Loosely corresponds to a day within a month.
/// </summary>
public class Date : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Date ID

    public string RowKey { get; set; } //Required -- Month ID

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??

    public int DateOrder { get; set; } // Add to database. Is the date itself - e.g. The 15th
    
    public int WeekOrder { get; set; } // Add to database. Is the numbered week - e.g The 2nd week

    public int DayOfTheWeekOrder { get; set; } // Add to database. Is the day of the week starting with Sunday as 0 - e.g. The 6th day of the week (Saturday; zero-based)

    public int MonthOrder { get; set; }

    public string MonthName { get; set; }

    public int Year { get; set; }

    public int TaskTypeCount { get; set; }
 
    public Guid DateTagGroupID { get; set; } // Links to a group of Tasks
}