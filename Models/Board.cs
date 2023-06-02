namespace Kanban.Models
{
    public class Board
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public bool IsVisible { get; set; } = true;
        // Do we need/want this here? It could be an interesting feature.

        public IEnumerable<int> ColumnIDs { get; set; }
        public virtual IEnumerable<Column> Columns { get; set; }

        public IEnumerable<int> SwimlaneIDs { get; set; }
        public virtual IEnumerable<Swimlane> Swimlanes { get; set; }

        public IEnumerable<int> TagIDs { get; set; }
        public virtual IEnumerable<Tag> Tags { get; set; }

        public IEnumerable<int> TriggerIDs { get; set; }
        public virtual IEnumerable<Trigger> Triggers { get; set; }
    }
}