namespace ArcStrides.Contracts.Request.Create;

/// <summary>
/// Puts a tag on something: a card, a task, a day, a column or a swimlane.
/// </summary>
public class TagCreateRequest
{
    /// <summary>
    /// The tag to put on, when it exists already. Leave it out to name the tag by
    /// its Title instead.
    /// </summary>
    public Guid? ID { get; init; } = null;

    /// <summary>
    /// What it is being put on.
    /// </summary>
    public Guid? ParentID { get; init; } = null;

    /// <summary>
    /// The tag's title. A tag that already has this title, in any case, is the one
    /// put on; otherwise a new tag is made with it.
    /// </summary>
    public string? Title { get; init; } = null;

    /// <summary>
    /// What kind of thing the parent is: 0 column, 1 swimlane, 2 date, 3 card,
    /// 4 task, 5 tag.
    /// </summary>
    public int? TypeID { get; init; } = null;
}
