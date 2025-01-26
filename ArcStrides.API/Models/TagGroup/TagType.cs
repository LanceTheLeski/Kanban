namespace ArcStrides.API.Models.TagGroup;

public class TagType : ArcTagGroupsEntity
{
    public int TagTypeID { get; set => EntityID = TagTypeID.ToString (); }

    public string? Title { get; set; }
}