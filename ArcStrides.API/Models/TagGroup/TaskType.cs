namespace ArcStrides.API.Models.TagGroup;

public class TaskType : ArcTagGroupsEntity
{
    public int TaskTypeID { get; set => EntityID = TaskTypeID.ToString (); }

    public string? Title { get; set; }
}