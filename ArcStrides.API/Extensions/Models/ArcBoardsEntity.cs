using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models.Board;

public class ArcBoardsEntity : ITableEntity
{
    public Guid BoardID { get; set => PartitionKey = BoardID!.ToString (); }
    public string? PartitionKey { get; set => BoardID = Guid.Parse (PartitionKey!); }

    public string EntityID { get; set => RowKey = EntityID!; }
    public string? RowKey { get; set => BoardID = Guid.Parse (RowKey!); }

    public DateTimeOffset? Timestamp { get; set; } = default!;

    public ETag ETag { get; set; } = default!;
}