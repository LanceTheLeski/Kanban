namespace Kanban.Contracts.Response;

public class DateResponse
{
    public string ID { get; set; }

    public int DateOrder { get; set; }

    public int WeekOrder { get; set; }

    public int DayOfTheWeekOrder { get; set; }

    public List<CardResponse> Cards { get; set; } = new List<CardResponse> { };
}