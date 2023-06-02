namespace Kanban.Models.TriggerExtensions
{
    public class Event
    {
        public int ID { get; set; }

        public int ObjectID { get; set; }

        public string ObjectType { get; set; }

        public EventType ObjectEventType { get; set; }

        public string PropertyName { get; set; }

        public string PropertyValue { get; set; }

        public EventType PropertyEventType { get; set; }
    }
}