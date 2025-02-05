using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.TagGroup;

[ArcTableName ("TagGroupTypes")]
public class TagGroupType : ArcTagGroupsEntity
{
    public override string RowKey { get; set; }

    public string? Title { get; set; }
}