using Kanban.Models.Tags;

namespace Kanban.Models
{
    public class Board
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public IEnumerable<Column> Columns { get; set; }

        public IEnumerable<Enum> Tags { get; set; }
    }
}