namespace Kanban.Models
{
    public class Board
    {
        public string Title { get; set; }

        public string Description { get; set; }

        public IEnumerable<Column> Columns { get; set; }
    }
}