using Azure;
using Azure.Data.Tables;

namespace Kanban.API.Models;

public class Task : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Task ID

    public string RowKey { get; set; } //Required -- Card ID - Main Card

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??

    public string Title { get; set; }

    public int TaskTypeID { get; set; }

    public Guid DeadlineID { get; set; } //Not sure how to do this yet so I'm abstracting it away
}