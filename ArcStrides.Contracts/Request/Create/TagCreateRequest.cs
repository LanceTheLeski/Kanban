namespace ArcStrides.Contracts.Request.Create;

public class TagCreateRequest
{
    public Guid? ParentID { get; init; } = null;

    public string? Title { get; init; } = null;

    public int? TypeID { get; init; } = null;
}