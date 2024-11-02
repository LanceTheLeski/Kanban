namespace Kanban.Contracts.Request.Create;

public class TimelineCreateRequest
{
    public Guid? StartDependencyTagGroupID { get; set; }

    public DateTime? StartPreferenceUTC { get; set; }

    public DateTime? StartDeadlineUTC { get; set; }

    public Guid? EndDependencyTagGroupID { get; set; }

    public DateTime? EndPreferenceUTC { get; set; }

    public DateTime? EndDeadlineUTC { get; set; }
}