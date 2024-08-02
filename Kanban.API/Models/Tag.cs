using Azure.Data.Tables;
using Azure;

namespace Kanban.API.Models;

public class Tag : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Tag ID

    public string RowKey { get; set; } //Required -- Parent Object ID -- interesting idea?

    public DateTimeOffset? Timestamp { get; set; } = default!; //Required

    public ETag ETag { get; set; } = default!; //Required ??

    public string Title { get; set; }

    public int TagType { get; set; }

    

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; }
}