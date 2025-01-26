namespace ArcStrides.API.Models.TagGroup;

public class TagGroupType : ArcTagGroupsEntity
{
    public override string RowKey { get; set; }

    public string? Title { get; set; }
}