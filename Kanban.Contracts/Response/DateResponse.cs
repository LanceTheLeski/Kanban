namespace Kanban.Contracts.Response;

public class DateResponse
{
    public string ID { get; set; }

    public int DateOrder { get; set; }

    public int WeekOrder { get; set; }

    public int DayOfTheWeekOrder { get; set; }

    public List<BasicTask> Tasks { get; set; } = new List<BasicTask> ();

    public class BasicTask
    { 
        public string Title { get; set; }
    }
}