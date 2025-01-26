using Azure.Data.Tables;
using Azure;

namespace ArcStrides.API.Models.TagGroup;

public class ArcTagGroupsEntity : ITableEntity
{
    public Guid TagGroupID { get; set => PartitionKey = TagGroupID!.ToString (); }
    public string? PartitionKey { get; set => TagGroupID = Guid.Parse (PartitionKey!); }

    public string EntityID { get; set => RowKey = EntityID!; }
    public string? RowKey { get; set => TagGroupID = Guid.Parse (RowKey!); }

    public DateTimeOffset? Timestamp { get; set; } = default!;

    public ETag ETag { get; set; } = default!;
}