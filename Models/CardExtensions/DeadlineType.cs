using System.Text.Json.Serialization;

namespace Kanban.Models.CardExtensions;

[JsonConverter (typeof (JsonConverter))]
public enum DeadlineType
{
    PassOrFail = 0,
    Routine = 1,
    PreferredTime = 2,
    RoutineWithPreferredTime = 3
}