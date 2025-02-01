namespace ArcStrides.API.Models.Tag;

public class Tag : ArcTagsEntity
{
    public string RowKey { get; set; }

    public string ParentObjectTypeName { get; set; }

    public string? Title { get; set; }

    public int TagTypeID { get; set; }

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; }
}