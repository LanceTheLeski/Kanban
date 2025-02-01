using Azure.Data.Tables;
using Azure;

namespace ArcStrides.API.Models;

public class ArcTagsEntity : ITableEntity
{
    public Guid TagID { get; set => PartitionKey = TagID!.ToString (); }
    public string? PartitionKey { get; set => TagID = Guid.Parse (PartitionKey!); }

    public string EntityID { get; set => RowKey = EntityID!; }
    public string? RowKey { get; set => TagID = Guid.Parse (RowKey!); }

    public DateTimeOffset? Timestamp { get; set; } = default!;

    public ETag ETag { get; set; } = default!;
}