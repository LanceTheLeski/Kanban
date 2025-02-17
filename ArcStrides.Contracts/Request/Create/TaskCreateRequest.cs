namespace ArcStrides.Contracts.Request.Create;

public class TaskCreateRequest
{
    public string? Title { get; set; } = null;

    public int? TaskTypeID { get; set; } = null;

    public Guid? CardID { get; set; } = null;

    public int? TaskOrder { get; set; } = null;

    public bool? IsComplete { get; set; } = null;

    public Guid? StartDependencyTagGroupID { get; init; } = null;

    public DateTime? StartPreferenceUTC { get; init; } = null;

    public DateTime? StartDeadlineUTC { get; init; } = null;

    public Guid? EndDependencyTagGroupID { get; init; } = null;

    public DateTime? EndPreferenceUTC { get; init; } = null;

    public DateTime? EndDeadlineUTC { get; init; } = null;
}