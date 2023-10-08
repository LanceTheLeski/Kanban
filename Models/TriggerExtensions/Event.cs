using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Kanban.Models.TriggerExtensions;

public class Event
{
    public int ID { get; set; }

    public int ObjectID { get; set; }

    public string ObjectType { get; set; }

    [JsonConverter (typeof (JsonStringEnumConverter))]
    [EnumDataType (typeof (EventType))]
    public EventType ObjectEventType { get; set; }

    public string PropertyName { get; set; }

    public string PropertyValue { get; set; }

    [JsonConverter (typeof (JsonStringEnumConverter))]
    [EnumDataType (typeof (EventType))]
    public EventType PropertyEventType { get; set; }
}