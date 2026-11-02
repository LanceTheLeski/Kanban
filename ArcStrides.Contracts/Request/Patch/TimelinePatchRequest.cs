namespace ArcStrides.Contracts.Request.Patch;

public class TimelinePatchRequest
{
    public int? TimelineTypeID { get; init; } = null;

    public Guid? StartDependencyTagGroupID { get; init; } = null;

    public DateTime? StartPreferenceUTC { get; init; } = null;

    public int? StartPreferenceDurationMinutes { get; init; } = null;

    public bool? StartPreferenceTimeIsRelative { get; init; } = null;

    public DateTime? StartDeadlineUTC { get; init; } = null;

    public int? StartDeadlineDurationMinutes { get; init; } = null;

    public bool? StartDeadlineTimeIsRelative { get; init; } = null;

    public Guid? EndDependencyTagGroupID { get; init; } = null;

    public DateTime? EndPreferenceUTC { get; init; } = null;

    public int? EndPreferenceDurationMinutes { get; init; } = null;

    public bool? EndPreferenceTimeIsRelative { get; init; } = null;

    public DateTime? EndDeadlineUTC { get; init; } = null;

    public int? EndDeadlineDurationMinutes { get; init; } = null;

    public bool? EndDeadlineTimeIsRelative { get; init; } = null;
}