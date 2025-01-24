using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models.Board;

public class CardPosition : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- BoardID

    public string RowKey { get; set; } //Required -- CardPositionID

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??

    //ParentID?

    public bool IsVisible { get; set; } = true;

    public Guid SwimlaneID { get; set; }

    public string SwimlaneTitle { get; set; }

    public int SwimlaneOrder { get; set; }

    public Guid ColumnID { get; set; }

    public string ColumnTitle { get; set; }

    public int ColumnOrder { get; set; }
}