using Azure.Data.Tables;
using Azure;

namespace Kanban.API.Models;

// This will be a new type of query where we look at all of the Groups and return only the needed one based on the two resources requested
public class TagGroup : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Tag Group ID

    public string RowKey { get; set; } //Required -- Tag ID

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??

    public string Title { get; set; }

    public int TagGroupType { get; set; }
}