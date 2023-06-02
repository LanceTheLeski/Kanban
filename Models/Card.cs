namespace Kanban.Models
{
    public class Card
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public Swimlane Swimlane { get; set; }

        public DateTime Deadline { get; set; }

        public CardExtensions.Checklist Checklist { get; set; }

        public IEnumerable<object> RequiredPeople { get; set; }

        public IEnumerable<object> OptionalPeople { get; set; }

        //More complicated - to do much later
        //public object Attachments { get; set; }

        //More complicated - to do much later
        //public object ChangeLog { get; set; }

        public virtual IEnumerable<Tag> Tags { get; set; }
    }
}