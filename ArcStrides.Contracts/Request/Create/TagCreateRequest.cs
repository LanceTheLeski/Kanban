namespace ArcStrides.Contracts.Request.Create;

public class TagCreateRequest
{
    public Guid ParentID { get; set; }

    public string Title { get; set; }

    public int TypeID { get; set; }
}