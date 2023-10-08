using Azure;
using Azure.Data.Tables;

namespace Kanban.Models;

public class Board : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- ID

    public string RowKey { get; set; } //Required -- Tag ID?

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??
    //Why the !(?)

    //public int ID { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public bool IsVisible { get; set; } = true;
    // Do we need/want this here? It could be an interesting feature.

    //public IEnumerable<int> TagIDs { get; set; }
    public virtual IEnumerable<Tag> Tags { get; set; }

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; }

    //public IEnumerable<int> CardIDs { get; set; }
    public virtual IEnumerable<Card> Cards { get; set; }

    //public IEnumerable<int> ColumnIDs { get; set; }
    public virtual IEnumerable<Column> Columns { get; set; }

    //public IEnumerable<int> SwimlaneIDs { get; set; }
    public virtual IEnumerable<Swimlane> Swimlanes { get; set; }
}