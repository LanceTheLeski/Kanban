namespace Kanban.Contracts.Request.Patch;

public class TaskPatchRequest
{
    public string Title { get; set; }

    public int TypeID { get; set; }

    public int TaskOrder { get; set; }

    public bool IsComplete { get; set; }

    public Guid TimelineID { get; set; }
}