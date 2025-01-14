using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models.TagGroup;

public class TaskType : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Task Type ID --> TagGroupID

    public string RowKey { get; set; } //Required -- Tag Group ID --> TagTypeID

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??

    public string Title { get; set; }
}