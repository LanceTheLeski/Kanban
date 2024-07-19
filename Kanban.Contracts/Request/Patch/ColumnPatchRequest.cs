namespace Kanban.Contracts.Request.Patch;

public class ColumnPatchRequest
{
    public string Title { get; set; }

    public int Order { get; set; }
}