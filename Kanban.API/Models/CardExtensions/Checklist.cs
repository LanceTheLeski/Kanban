using Azure;

namespace Kanban.API.Models.CardExtensions;

public class Checklist
{
    public string PartitionKey { get; set; } //Required -- Checklist ID

    public string RowKey { get; set; } //Required -- Card ID

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public Guid ItemID { get; set; } // Every checklist will have items and this will be unique for each item

    public bool ItemIsComplete { get; set; }

    public bool ItemIsStillNeeded { get; set; }

    public string ItemText { get; set; }

    //public Guid LinkedCardID { get; set; } // ID for a card that is essentially this task?
}