namespace Kanban.Contracts.Response;

public class TaskResponse
{
    public string Title { get; set; }

    public int TaskTypeID { get; set; }

    public string TaskTypeTitle { get; set; }

    public bool isCompleted { get; set; }
}