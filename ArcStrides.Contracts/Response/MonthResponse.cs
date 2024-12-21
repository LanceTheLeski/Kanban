namespace ArcStrides.Contracts.Response;

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

        public List<BasicCard> Cards { get; set; } = new List<BasicCard> ();
    }

    public class BasicCard
    {
        public string Title { get; set; }

        public Guid BoardID { get; set; }

        public string BoardTitle { get; set; }

        public List<TaskResponse> Tasks { get; set; } = new List<TaskResponse> ();
    }
}