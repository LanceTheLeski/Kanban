namespace Kanban.Contracts.Request.Create;

public class CardCreateRequest
{
    public string Title { get; set; }

    public string Description { get; set; }

    public Guid BoardID { get; set; } //PartitionKey

    public Guid ColumnID { get; set; }

    public Guid SwimlaneID { get; set; }
}