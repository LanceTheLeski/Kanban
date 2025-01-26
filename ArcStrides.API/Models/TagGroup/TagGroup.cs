namespace ArcStrides.API.Models.TagGroup;

// This will be a new type of query where we look at all of the Groups and return only the needed one based on the two resources requested
public class TagGroup : ArcTagGroupsEntity
{
    public override string RowKey { get; set; }

    public string? Title { get; set; }

    public int TagGroupTypeID { get; set; }
}