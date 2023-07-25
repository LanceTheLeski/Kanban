namespace Kanban.Models.Board
{
    public class Card
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public DateTime Deadline { get; set; }

        public CardExtensions.Checklist Checklist { get; set; }

        public IEnumerable<object> RequiredPeople { get; set; }

        public IEnumerable<object> OptionalPeople { get; set; }

        public IEnumerable<Tag> Tags { get; set; }

        public IEnumerable<int> ParentBoardIds { get; set; }

        public IEnumerable<int> ParentSwimlaneIds { get; set; }

        public IEnumerable<int> ParentColumnIds { get; set; }

        //More complicated - to do much later
        //public object Attachments { get; set; }

        //More complicated - to do much later
        //public object ChangeLog { get; set; }
    }
}