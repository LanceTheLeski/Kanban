using Azure;
using Azure.Data.Tables;

namespace Kanban.API.Models;

public class Timeline : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Timeline ID

    public string RowKey { get; set; } //Required -- Parent Object ID (Card/Task)

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    // From here on out, object will be a placeholder for a DateTime, but something that probably relates to the recurrence calendar?

    // Everything that needs to be done prior to start. Should probably link to a TAG GROUP GUID with children being Tasks. This deadline would obviously be the parent of the group.
    public Guid? StartDependencyTagGroupID { get; set; }

    public DateTime? StartPreferenceUTC { get; set; }

    public DateTime? StartDeadlineUTC { get; set; }

    public Guid? EndDependencyTagGroupID { get; set; }

    public DateTime? EndPreferenceUTC { get; set; }

    public DateTime? EndDeadlineUTC { get; set; }
}