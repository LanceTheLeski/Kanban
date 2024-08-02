using Azure;
using Azure.Data.Tables;

namespace Kanban.API.Models;

public class TaskType : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Task Type ID

    public string RowKey { get; set; } //Required -- Tag Group ID -- We can have tagged event's attached to a Type. We need something else to tie to an ID. Why not...

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??

    public string Title { get; set; }
}