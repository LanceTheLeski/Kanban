using Azure.Data.Tables;
using Azure;

namespace Kanban.API.Models;

public class Swimlane : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Swimlane ID

    public string RowKey { get; set; } //Required -- Board ID

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;

    public int SwimlaneOrder { get; set; }

    public string BoardTitle { get; set; }

    public Swimlane DeepCopy ()
     => new Swimlane
     {
         PartitionKey = this.PartitionKey,
         RowKey = this.RowKey,
         Timestamp = this.Timestamp,
         ETag = this.ETag,
         Title = this.Title,
         IsVisible = this.IsVisible,
         SwimlaneOrder = this.SwimlaneOrder,
         BoardTitle = this.BoardTitle
     };

    //public IEnumerable<int> CardIDs { get; set; }
    //public virtual IEnumerable<Card> Cards { get; set; } //Same as columns

    //public IEnumerable<int> TagIDs { get; set; }
    //public virtual IEnumerable<Tag> Tags { get; set; } //Let's return to this later

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; } //Let's return to this later
}