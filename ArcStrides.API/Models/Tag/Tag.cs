using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Tag;

[ArcTableName ("Tags")]
public class Tag : ArcTagsEntity
{
    /// <summary>
    /// The tag's parent: the card, task or date it is on.
    /// </summary>
    /// <remarks>
    /// <c>override</c>, as on every other entity. Without it this property hid
    /// ArcTagsEntity.RowKey instead of replacing it, and the table client — which
    /// reads the key through ITableEntity — saw the base one, always null. Every
    /// tag write failed with "Value cannot be null. (Parameter 'RowKey')",
    /// TagController.CreateTag included.
    /// </remarks>
    public override string RowKey { get; set; }

    public string ParentObjectTypeName { get; set; }

    public string? Title { get; set; }

    /// <summary>
    /// What kind of thing the parent is — see <see cref="TagParentTypes"/>.
    /// </summary>
    public int TagTypeID { get; set; }

    /// <summary>
    /// A tag someone put on its parent, shown with it. False for the calendar's rows.
    /// </summary>
    /// <remarks>
    /// A tag is one ID (the PartitionKey) and a row for each thing it is on (the
    /// RowKey), so "Blocked" on a card and on a task is one tag with two rows.
    ///
    /// The calendar uses this table too, for something that is not a tag: a day
    /// names a group of tags, and each of those rows is how a card is on the day
    /// (CalendarController). Those rows have a parent of type card as well, so
    /// without this a card's tags would include one per day it is on, titled with
    /// the card's own title. They were written before this field existed and read
    /// as false, which is what they are.
    /// </remarks>
    public bool IsLabel { get; set; }

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; }
}