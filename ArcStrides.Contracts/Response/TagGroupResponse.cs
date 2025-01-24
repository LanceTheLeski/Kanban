namespace ArcStrides.Contracts.Response;

public class TagGroupResponse
{
    public Guid? ID { get; init; } = null;

    public Guid? TagID { get; init; } = null;

    public string? Title { get; init; } = null;

    public int? TagGroupTypeID { get; init; } = null;
}