namespace ArcStrides.Contracts.Response;

public class BoardResponse
{
    public Guid ID { get; set; }

    public string Title { get; set; }

    public ICollection<ColumnResponse>? newColumns { get; set; } = null;

    public ICollection<SwimlaneResponse>? newSwimlanes { get; set; } = null;

    public ICollection<CardResponse>? newCards { get; set; } = null;
}