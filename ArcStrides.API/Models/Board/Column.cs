using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models.Board;

public class Column : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Column ID --> BoardID

    public string RowKey { get; set; } //Required -- Board ID --> ColumnID

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;

    public int ColumnOrder { get; set; } //For the given board

    public double GlobalColumnOrder { get; set; } //For when we want to quickly create a board on the fly.

    public string ColumnColor { get; set; }

    public string GlobalColumnColor { get; set; }

    //public string BoardTitle { get; set; }
}