using Azure.Data.Tables;
using Azure;

namespace ArcStrides.API.Models;

public class ArcTagsEntity : ITableEntity
{
    /// <summary>
    /// Tag ID
    /// </summary>
    public string? PartitionKey { get; set; }

    public virtual string? RowKey { get; set; }

    public DateTimeOffset? Timestamp { get; set; } = default!;

    public ETag ETag { get; set; } = default!;
}