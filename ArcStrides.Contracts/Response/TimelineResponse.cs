namespace ArcStrides.Contracts.Response;

public class TimelineResponse
{
    public Guid? ID { get; init; } = null;

    public int? TimelineTypeID { get; init; } = null;

    public Guid? StartDependencyTagGroupID { get; init; } = null;

    public DateTime? StartPreferenceUTC { get; init; } = null;

    public DateTime? StartDeadlineUTC { get; init; } = null;

    public Guid? EndDependencyTagGroupID { get; init; } = null;

    public DateTime? EndPreferenceUTC { get; init; } = null;

    public DateTime? EndDeadlineUTC { get; init; } = null;
}