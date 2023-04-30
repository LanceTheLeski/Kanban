namespace Kanban.Models
{
    public class Swimlane
    {
        public string Title { get; set; }

        public int Id { get; set; }

        public bool IsVisible { get; set; } = true;
    }
}