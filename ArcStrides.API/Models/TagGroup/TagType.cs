using Azure.Data.Tables;
using Azure;

namespace ArcStrides.API.Models.TagGroup;

public class TagType : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Tag Type ID --> TagGroupID

    public string RowKey { get; set; } //Required -- Tag Group ID --> TagTypeID

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }
}