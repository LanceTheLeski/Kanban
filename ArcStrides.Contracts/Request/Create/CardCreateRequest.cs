namespace ArcStrides.Contracts.Request.Create;

public class CardCreateRequest
{
    public string? Title { get; init; } = null;

    public string? Description { get; init; } = null;

    public Guid? StartDependencyTagGroupID { get; init; } = null;

    public DateTime? StartPreferenceUTC { get; init; } = null;

    public DateTime? StartDeadlineUTC { get; init; } = null;

    public Guid? EndDependencyTagGroupID { get; init; } = null;

    public DateTime? EndPreferenceUTC { get; init; } = null;

    public DateTime? EndDeadlineUTC { get; init; } = null;

    public Guid? ColumnID { get; init; } = null;

    public Guid? SwimlaneID { get; init; } = null;

    /// <summary>
    /// The rank of the card within its cell. Lower is nearer the top.
    /// </summary>
    public int? PositionRank { get; init; } = null;
}