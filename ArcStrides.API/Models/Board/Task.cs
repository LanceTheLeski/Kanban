using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models.Board;

public class Task : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Task ID --> BoardID

    public string RowKey { get; set; } //Required -- Card ID - Main Card --> TaskID

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??

    public string Title { get; set; }

    public Guid CardID { get; set; } //Parent Card

    public int TaskTypeID { get; set; }

    public int TaskOrder { get; set; }

    public bool IsComplete { get; set; }

    public Guid? TimelineID { get; set; }
}