using Azure.Data.Tables;
using Azure;
using Kanban.Models.CardExtensions;

namespace Kanban.Models;

public class Card : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- ID

    public string RowKey { get; set; } //Required -- Tag ID?

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public int ID { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    //public IEnumerable<int> TagIDs { get; set; }
    //public virtual IEnumerable<Tag> Tags { get; set; }

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; }

    //public int DeadlineID { get; set; }
    //public virtual Deadline Deadline { get; set; }

    //public int ChecklistID { get; set; }
    //public virtual Checklist Checklist { get; set; }

    //public IEnumerable<int> RequiredPeopleIDs { get; set; }
    //public virtual IEnumerable<object> RequiredPeople { get; set; }

    //public IEnumerable<int> OptionalPeopleIDs { get; set; }
    //public virtual IEnumerable<object> OptionalPeople { get; set; }

    //More complicated - to do much later
    //public object Attachments { get; set; }

    //More complicated - to do much later
    //public object ChangeLog { get; set; }
}