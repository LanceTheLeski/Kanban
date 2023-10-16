using Azure.Data.Tables;
using Azure;

namespace Kanban.Models;

public class Swimlane : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- ID

    public string RowKey { get; set; } //Required -- Card ID?

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public int ID { get; set; }

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;

    //public IEnumerable<int> CardIDs { get; set; }
    public virtual IEnumerable<Card> Cards { get; set; }

    //public IEnumerable<int> TagIDs { get; set; }
    public virtual IEnumerable<Tag> Tags { get; set; }

    //public IEnumerable<int> TriggerIDs { get; set; }
    public virtual IEnumerable<Trigger> Triggers { get; set; }
}