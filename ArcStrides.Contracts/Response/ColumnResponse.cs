namespace ArcStrides.Contracts.Response;

public class ColumnResponse
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;

    public int? Order { get; init; } = null;

    public Guid? BoardID { get; init; } = null;

    /// <summary>
    /// The background the column's name is written on, as a CSS colour.
    ///
    /// Null means the board has not been given one, and the UI falls back to a
    /// ramp derived from its position — palest on the left. Stored on the model since
    /// the first version of it; this is the first release that carries it as
    /// far as the client.
    /// </summary>
    public string? Color { get; init; } = null;

    /// <summary>
    /// The colour this column keeps when a board is built from a template.
    ///
    /// Separate from Color because the per-board value is free to repeat and
    /// this one is not: it is how a column is recognised across boards. The
    /// uniqueness is not enforced yet — see docs/api-gaps.md.
    /// </summary>
    public string? GlobalColor { get; init; } = null;
}