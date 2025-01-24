namespace ArcStrides.Contracts.Request.Create;

public class ColumnCreateRequest
{
    public string? Title { get; init; } = null;

    public int? Order { get; init; } = null;
}