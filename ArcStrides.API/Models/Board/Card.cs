using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Board;

[ArcTableName ("Cards")]
public class Card : ArcBoardsEntity
{
    public override string RowKey { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public Guid? CardPositionID { get; set; }

    public Guid? TimelineID { get; set; }

    public Guid? StartDependencyTagGroupID { get; set; }

    public DateTime? StartPreferenceUTC { get; set; }

    public DateTime? StartDeadlineUTC { get; set; }

    public Guid? EndDependencyTagGroupID { get; set; }

    public DateTime? EndPreferenceUTC { get; set; }

    public DateTime? EndDeadlineUTC { get; set; }

    /// <summary>
    /// Whether the card keeps dates of its own rather than taking its tasks'.
    /// </summary>
    /// <remarks>
    /// By default a card's schedule is its tasks' put together: the earliest of
    /// their starts and the latest of their ends, point by point (the UI works it
    /// out, in Timeline.Inheritance.ts). True means the card's own timeline is used
    /// instead; its tasks keep theirs and still show on their own days.
    ///
    /// Null on a card written before this existed, which the UI reads as true when
    /// the card has a timeline of its own — so a date someone set on a card is not
    /// silently replaced by its tasks' — and false otherwise.
    /// </remarks>
    public bool? OverridesTaskTimelines { get; set; }

    //public IEnumerable<int> TagIDs { get; set; }
    //public virtual IEnumerable<Tag> Tags { get; set; }

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; }

    //public int ChecklistID { get; set; }
    //public virtual Checklist Checklist { get; set; }

    //public IEnumerable<int> RequiredPeopleIDs { get; set; }
    //public virtual IEnumerable<object> RequiredPeople { get; set; }

    //public IEnumerable<int> OptionalPeopleIDs { get; set; }
    //public virtual IEnumerable<object> OptionalPeople { get; set; }

    //More complicated - to do much later
    //public object Attachments { get; set; }

    //More complicated - to do much later
    //public object ChangeLog { get; set; }
}