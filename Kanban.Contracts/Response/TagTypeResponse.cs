namespace Kanban.Contracts.Response;

public class TagTypeResponse
{
    public Guid ID { get; set; }

    public Guid TagGroupID { get; set; }

    public string Title { get; set; }
}