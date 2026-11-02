namespace ArcStrides.UI.Models.Board;

public class Board
{
    public Guid ID { get; set; }

    public string? Title { get; init; } = null;

    public IEnumerable<Column>? Columns { get; init; } = null;

    public IEnumerable<Swimlane>? Swimlanes { get; init; } = null;

    public IEnumerable<Card>? Cards { get; init; } = null;
}