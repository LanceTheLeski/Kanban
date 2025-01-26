using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models.Board;

public class ArcBoardsEntity : ITableEntity
{
    /// <summary>
    /// Board ID
    /// </summary>
    public string? PartitionKey { get; set; }

    public virtual string? RowKey { get; set; }

    public DateTimeOffset? Timestamp { get; set; } = default!;

    public ETag ETag { get; set; } = default!;
}