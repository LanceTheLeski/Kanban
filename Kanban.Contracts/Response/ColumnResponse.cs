namespace Kanban.Contracts.Response;

public class ColumnResponse
{
    public Guid ID { get; set; } = Guid.Empty;

    public string Title { get; set; } = string.Empty;

    public int Order { get; set; } = -1;

    public Guid? BoardID { get; set; } = null;
}