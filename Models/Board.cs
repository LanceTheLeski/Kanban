using Azure;
using Azure.Data.Tables;

namespace Kanban.Models;

public class Board : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Board ID

    public string RowKey { get; set; } //Required -- Card ID

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??
    //Why the !(?)

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;
    // Do we need/want this here? It could be an interesting feature.

    public Guid SwimlaneID { get; set; }

    public string SwimlaneTitle { get; set; }

    public int SwimlaneOrder { get; set; }

    public Guid ColumnID { get; set; }

    public string ColumnTitle { get; set; }

    public int ColumnOrder { get; set; }

    public string CardTitle { get; set; }

    public string CardDescription { get; set; }
}