using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.TagGroup;

[ArcTableName ("TaskTypes")]
public class TaskType : ArcTagGroupsEntity
{
    /// <summary>
    /// ID of the Task Type as an integer.
    /// </summary>
    public override string RowKey { get; set; }

    public string? Title { get; set; }
}