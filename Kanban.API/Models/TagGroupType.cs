using Azure;
using Azure.Data.Tables;

namespace Kanban.API.Models;

public class TagGroupType : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Tag Group ID

    public string RowKey { get; set; } //Required -- Tag Group ID - Actions linked to this type 

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }
}