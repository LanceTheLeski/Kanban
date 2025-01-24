namespace ArcStrides.Contracts.Response;

public class TagResponse
{
    public Guid? ID { get; init; } = null;

    public Guid? ParentID { get; init; } = null;

    public string? ParentTypeName { get; init; } = null;

    public string? Title { get; init; } = null;
}