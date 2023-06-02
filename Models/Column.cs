namespace Kanban.Models
{
    public class Column
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public bool IsVisible { get; set; } = true;
    }
}