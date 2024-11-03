namespace Kanban.Contracts.Response;

public class TagResponse
{
    public Guid TagID { get; set; }

    public string? ParentNameOfType { get; set; } = null;

    public Guid ParentID { get; set; }
}