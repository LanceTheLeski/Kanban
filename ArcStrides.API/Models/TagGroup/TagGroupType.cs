namespace ArcStrides.API.Models.TagGroup;

public class TagGroupType : ArcTagGroupsEntity
{
    public int TagGroupTypeID { get; set => EntityID = TagGroupTypeID.ToString (); }

    public string? Title { get; set; }
}