namespace Kanban.Contracts.Response;

public class TagGroupResponse
{
    public Guid ID { get; set; }

    public Guid TagID { get; set; }

    public string Title { get; set; }

    public int TagGroupType { get; set; }
}