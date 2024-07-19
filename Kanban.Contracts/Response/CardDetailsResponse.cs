namespace Kanban.Contracts.Response;

public class CardDetailsResponse
{
    public string ID { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public string ColumnID { get; set; }

    public string ColumnTitle { get; set; }

    public string SwimlaneID { get; set; }

    public string SwimlaneTitle { get; set; }

    //public TimelineResponse Reminder { get; set; }
}