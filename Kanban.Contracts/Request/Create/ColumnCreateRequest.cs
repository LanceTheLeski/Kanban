namespace Kanban.Contracts.Request.Create;

public class ColumnCreateRequest
{
    public string Title { get; set; }

    public int Order { get; set; }

    public Guid BoardID { get; set; }
}