namespace Kanban.Models
{
    public class Column
    {
        public string Title { get; set; }

        public virtual IEnumerable<Card> Cards { get; set; } 
    }
}