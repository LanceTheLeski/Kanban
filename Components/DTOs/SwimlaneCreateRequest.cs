namespace Kanban.Components.DTOs;

public class SwimlaneCreateRequest
{
    public string Title { get; set; }

    public int Order { get; set; }

    public Guid BoardID { get; set; }
}