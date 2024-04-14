using Azure.Data.Tables;
using Azure;

namespace Kanban.Models;

public class Swimlane : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- ID

    public string RowKey { get; set; } //Required -- Card ID? ---<> Board ID (following decision for column)

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;

    public int SwimlaneOrder { get; set; }

    public string BoardTitle { get; set; }

    //public IEnumerable<int> CardIDs { get; set; }
    //public virtual IEnumerable<Card> Cards { get; set; } //Same as columns

    //public IEnumerable<int> TagIDs { get; set; }
    //public virtual IEnumerable<Tag> Tags { get; set; } //Let's return to this later

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; } //Let's return to this later
}