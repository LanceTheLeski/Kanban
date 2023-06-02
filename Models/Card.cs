using Kanban.Models.CardExtensions;

namespace Kanban.Models
{
    public class Card
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public Swimlane Swimlane { get; set; }

        public Deadline Deadline { get; set; }

        public Checklist Checklist { get; set; }

        public IEnumerable<int> RequiredPeopleIDs { get; set; }
        public virtual IEnumerable<object> RequiredPeople { get; set; }

        public IEnumerable<int> OptionalPeopleIDs { get; set; }
        public virtual IEnumerable<object> OptionalPeople { get; set; }

        //More complicated - to do much later
        //public object Attachments { get; set; }

        //More complicated - to do much later
        //public object ChangeLog { get; set; }

        public IEnumerable<int> TagIDs { get; set; }
        public virtual IEnumerable<Tag> Tags { get; set; }
    }
}