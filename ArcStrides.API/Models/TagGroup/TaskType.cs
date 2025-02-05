using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.TagGroup;

[ArcTableName ("TaskTypes")]
public class TaskType : ArcTagGroupsEntity
{
    public override string RowKey { get; set; }

    public string? Title { get; set; }
}