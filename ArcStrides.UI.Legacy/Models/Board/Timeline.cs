namespace ArcStrides.UI.Models.Board;

public class Timeline
{
    public Guid? ID { get; init; } = null;

    public int? TimelineTypeID { get; init; } = null;

    public Guid? StartDependencyTagGroupID { get; init; } = null; // Typically I want to stray from having Guids on UI models but I'm
                                                                  // leaving this here since TagGroups are in a different "domain"

    public DateTime? StartPreferenceUTC { get; init; } = null;

    public DateTime? StartDeadlineUTC { get; init; } = null;

    public Guid? EndDependencyTagGroupID { get; init; } = null;

    public DateTime? EndPreferenceUTC { get; init; } = null;

    public DateTime? EndDeadlineUTC { get; init; } = null;
}