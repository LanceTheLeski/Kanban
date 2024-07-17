namespace Kanban.API.Models;

public class Tag
{
    public int ID { get; set; }

    public string Title { get; set; }

    public string TagType { get; set; }

    public IEnumerable<int> TriggerIDs { get; set; }
    public virtual IEnumerable<Trigger> Triggers { get; set; }
}