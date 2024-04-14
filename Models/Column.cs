using Azure;
using Azure.Data.Tables;

namespace Kanban.Models;

public class Column : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Column ID

    public string RowKey { get; set; } //Required -- Board ID 

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;

    public int ColumnOrder { get; set; } //For the given board

    public string BoardTitle { get; set; }

    //public IEnumerable<int> TagIDs { get; set; }
    //public virtual IEnumerable<Tag> Tags { get; set; } //Let's return to this later

    //public virtual IEnumerable<Card> Cards { get; set; } //I'm not sure about this now that I'm tying columns to boards?

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; } //Let's return to this later
}