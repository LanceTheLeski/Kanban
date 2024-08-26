namespace Kanban.Contracts.Response;

public class MonthResponse
{
    public string ID { get; set; }

    public string Title { get; set; }

    public List<BasicDate> Days { get; set; } = new List<BasicDate> ();

    public class BasicDate
    {
        public string ID { get; set; }

        public int DateOrder { get; set; }

        public int WeekOrder { get; set; }

        public int DayOfTheWeekOrder { get; set; }

        public List<BasicTask> Tasks { get; set; } = new List<BasicTask> ();
    }

    public class BasicTask
    {
        public string Title { get; set; }
    }
}