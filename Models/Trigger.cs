using Kanban.Models.TriggerExtensions;

namespace Kanban.Models;

public class Trigger
{
    public int ID { get; set; }

    public string Title { get; set; }

    public IEnumerable<int> CauseIDs { get; set; }
    public virtual IEnumerable<Event> Causes { get; set; }

    public IEnumerable<int> EffectIDs { get; set; }
    public virtual IEnumerable<Event> Effects { get; set; }
}