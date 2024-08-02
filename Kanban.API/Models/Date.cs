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

    public byte MonthOrder { get; set; }

    public string MonthName { get; set; }

    public int Year { get; set; }

    public int TaskTypeCount { get; set; }
 
    public Guid DateTagGroupID { get; set; }
}