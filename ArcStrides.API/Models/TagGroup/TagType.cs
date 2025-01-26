namespace ArcStrides.API.Models.TagGroup;

public class TagType : ArcTagGroupsEntity
{
    public override string RowKey { get; set; }

    public string? Title { get; set; }
}