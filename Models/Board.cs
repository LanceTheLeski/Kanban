namespace Kanban.Models
{
    public class Board
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public virtual IEnumerable<Column> Columns { get; set; }

        public virtual IEnumerable<Swimlane> Swimlanes { get; set; }

        public virtual IEnumerable<Tag> Tags { get; set; }
    }
}