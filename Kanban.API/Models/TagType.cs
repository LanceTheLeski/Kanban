using Azure.Data.Tables;
using Azure;

namespace Kanban.API.Models;

public class TagType : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Tag Type ID

    public string RowKey { get; set; } //Required -- Tag Group ID 

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }
}