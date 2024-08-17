namespace Kanban.Contracts.Response;

public class MonthResponse
{
    public string ID { get; set; }

    public string Title { get; set; }

    public List<BasicDate> Days { get; set; } = new List<BasicDate> ();

    public class BasicDate
    {
        public string ID { get; set; }

        public byte DateOrder { get; set; }

        public byte WeekOrder { get; set; }

        public byte DayOfTheWeekOrder { get; set; }

        public List<BasicTask> Tasks { get; set; } = new List<BasicTask> ();
    }

    public class BasicTask
    {
        public string Title { get; set; }
    }
}