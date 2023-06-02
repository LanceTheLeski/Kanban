namespace Kanban.Models
{
    public class Column
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public bool IsVisible { get; set; } = true;

        public IEnumerable<int> TagIDs { get; set; }
        public virtual IEnumerable<Tag> Tags { get; set; }

        public IEnumerable<int> TriggerIDs { get; set; }
        public virtual IEnumerable<Trigger> Triggers { get; set; }
    }
}