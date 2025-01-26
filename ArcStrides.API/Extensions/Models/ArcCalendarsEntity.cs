using Azure.Data.Tables;
using Azure;

namespace ArcStrides.API.Models.Calendar;

public class ArcCalendarsEntity : ITableEntity
{
    public Guid MonthID { get; set => PartitionKey = MonthID!.ToString (); }
    public string? PartitionKey { get; set => MonthID = Guid.Parse (PartitionKey!); }

    public string EntityID { get; set => RowKey = EntityID!; }
    public string? RowKey { get; set => MonthID = Guid.Parse (RowKey!); }

    public DateTimeOffset? Timestamp { get; set; } = default!;

    public ETag ETag { get; set; } = default!;
}