using System.Text.Json.Serialization;

namespace Kanban.Models.TriggerExtensions
{
    [JsonConverter (typeof (JsonConverter))]
    public enum EventType
    {
        Create = 0,
        Edit = 1,
        Destroy = 2
    }
}