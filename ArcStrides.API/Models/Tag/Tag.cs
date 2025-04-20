using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Tag;

[ArcTableName ("Tags")]
public class Tag : ArcTagsEntity
{
    /// <summary>
    /// Parent Object ID.
    /// </summary>
    public string RowKey { get; set; }

    public string ParentObjectTypeName { get; set; }

    public string? Title { get; set; }

    public int TagTypeID { get; set; }

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; }
}