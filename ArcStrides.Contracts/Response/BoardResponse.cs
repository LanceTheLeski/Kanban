namespace ArcStrides.Contracts.Response;

public class BoardResponse
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;

    public ICollection<ColumnResponse>? Columns { get; init; } = null;

    public ICollection<SwimlaneResponse>? Swimlanes { get; init; } = null;

    public ICollection<CardResponse>? Cards { get; init; } = null;
}