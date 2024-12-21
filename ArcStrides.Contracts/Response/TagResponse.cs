namespace ArcStrides.Contracts.Response;

public class TagResponse
{
    public Guid TagID { get; set; }

    public Guid ParentID { get; set; }

    public string? ParentTypeName { get; set; } = null;

    public string Title { get; set; }
}