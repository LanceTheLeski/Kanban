namespace ArcStrides.Contracts.Response;

public class ColumnResponse
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;

    public int? Order { get; init; } = null;

    public Guid? BoardID { get; init; } = null;
}