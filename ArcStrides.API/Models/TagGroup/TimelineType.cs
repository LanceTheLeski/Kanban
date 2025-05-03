using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.TagGroup;

[ArcTableName ("TimelineTypes")]
public class TimelineType : ArcTagGroupsEntity
{
    /// <summary>
    /// ID of the timeline type as an integer.
    /// Indicates deadline or (proper) timeline.
    /// Also indicates Card or Task parent.
    /// </summary>
    public string RowKey { get; set; }

    public string Title { get; set; }
}