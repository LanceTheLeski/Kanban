using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models;

public class Timeline : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Timeline ID

    public string RowKey { get; set; } //Required -- Parent Object ID (Card/Task)

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    //Ideally this only refers to what type of parent the Timeline has: Card or Task? Could also be used to identify what type of deadlines and all are set.
    public int TimelineTypeID { get; set; }

    // Everything that needs to be done prior to start. Should probably link to a TAG GROUP GUID with children being Tasks. This deadline would obviously be the parent of the group.
    public Guid? StartDependencyTagGroupID { get; set; }

    public DateTime? StartPreferenceUTC { get; set; }

    public DateTime? StartDeadlineUTC { get; set; }

    public Guid? EndDependencyTagGroupID { get; set; }

    public DateTime? EndPreferenceUTC { get; set; }

    public DateTime? EndDeadlineUTC { get; set; }
}