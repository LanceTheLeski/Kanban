namespace Kanban.Contracts.Request.Create;

public class TaskCreateRequest
{
    public string Title { get; set; }

    public int TaskTypeID { get; set; }

    public Guid CardID {  get; set; }


    //public Guid DeadlineID { get; set; } - TODO: Implement this later
}