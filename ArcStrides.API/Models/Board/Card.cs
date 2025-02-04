using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Board;

[ArcTableName("Cards")]
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