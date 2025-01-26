namespace ArcStrides.API.Models.Board;

public class Task : ArcBoardsEntity
{
    public Guid TaskID { get; set => EntityID = TaskID.ToString (); }

    public string Title { get; set; }

    public Guid CardID { get; set; } //Parent Card

    public int TaskTypeID { get; set; }

    public int TaskOrder { get; set; }

    public bool IsComplete { get; set; }

    public Guid? TimelineID { get; set; }
}