using Azure;

namespace Kanban.API.Models.CardExtensions;

public class Timeline
{
    public string PartitionKey { get; set; } //Required -- Timeline ID

    public string RowKey { get; set; } //Required -- Card ID

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    // From here on out, object will be a placeholder for a DateTime, but something that probably relates to the recurrence calendar?

    // Everything that needs to be done prior to start. Should probably link to a TAG GUID with children of Cards (or Columns/Swimlanes)
    public Guid StartDependency { get; set; }

    public object StartPreference { get; set; }

    public object StartDeadline { get; set; }

    public Guid EndDependency { get; set; }

    public object EndPreference { get; set; }

    public object EndDeadline { get; set; }

    // Probabl needs to be fleshed out
    public object TimelineReoccurrance { get; set; }
}