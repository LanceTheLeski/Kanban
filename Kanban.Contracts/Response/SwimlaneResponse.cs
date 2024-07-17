namespace Kanban.Contracts.Response;

public class SwimlaneResponse
{
    public Guid ID { get; set; }

    public string Title { get; set; }

    public Guid BoardID { get; set; }

    public int Order { get; set; }
}