namespace Kanban.Models
{
    public class Tag
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public Type TagType { get; set; }

        public enum Type
        {
            Card = 0
            Board = 1,
            Column = 2,
            Swimlane = 3
        }
    }
}
