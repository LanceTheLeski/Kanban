using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models.TagGroup;

public class TagGroupType : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Tag Group Type ID --> TagGroupID

    public string RowKey { get; set; } //Required -- Tag Group ID - Actions linked to this type --> TagGroupTypeID

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }
}