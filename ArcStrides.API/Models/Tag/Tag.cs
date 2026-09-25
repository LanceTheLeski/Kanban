using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Tag;

[ArcTableName ("Tags")]
public class Tag : ArcTagsEntity
{
    /// <summary>
    /// Parent Object ID.
    /// </summary>
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

    public int TagTypeID { get; set; }

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; }
}