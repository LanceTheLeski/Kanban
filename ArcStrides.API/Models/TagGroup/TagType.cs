using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.TagGroup;

[ArcTableName ("TagTypes")]
public class TagType : ArcTagGroupsEntity
{
    public override string RowKey { get; set; }

    public string? Title { get; set; }
}