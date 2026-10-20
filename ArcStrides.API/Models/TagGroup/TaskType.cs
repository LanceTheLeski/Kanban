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

    /// <summary>
    /// The type's colour on the calendar's charts and marks, as <c>#rrggbb</c>; null
    /// for the one its place in the type list gives it.
    /// </summary>
    public string? Color { get; set; }
}