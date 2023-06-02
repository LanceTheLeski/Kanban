namespace Kanban.Models
{
    public class Trigger
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public Event TriggerCause { get; set; }
        public Event TriggerEffect { get; set; }

        //Causes:
        //Card/Column/Swimlane is created, edited, or destroyed.
        //Tag is assigned.

        public string TriggerType { get; set; }

        public int CardIdReference { get; set; }
        public virtual Card CardReference { get; set; }

        public int BoardIdReference { get; set; }
        public virtual Board BoardReference { get; set; }

        public int SwimlaneIdReference { get; set; }
        public virtual Swimlane SwimlaneReference { get; set; }

        public int ColumnIdReference { get; set; }
        public virtual Column ColumnReference { get; set; }

        //Effects:
        //Create new Card elsewhere
        //Edit/update Card elsewhere
        //Assign tag

        public enum Event
        {
            Created = 0,
            Edited = 1,
            Destroyed = 2
        }
    }
}