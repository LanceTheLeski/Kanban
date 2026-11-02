using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Board;

[ArcTableName ("Timelines")]
public class Timeline : ArcBoardsEntity
{
    /// <summary>
    /// Timeline ID as Guid.
    /// </summary>
    public override string? RowKey { get; set; }

    public Guid? ParentObjectID { get; set; }

    public int? TimelineTypeID { get; set; }

    // Everything that needs to be done prior to start. Should probably link to a TAG GROUP GUID with children being Tasks. This deadline would obviously be the parent of the group.
    public Guid? StartDependencyTagGroupID { get; set; }

    public DateTime? StartPreferenceUTC { get; set; }

    /// <summary>
    /// How long the point lasts, in minutes, from its time. Null for a point that
    /// is an instant. The same for the three points after it.
    /// </summary>
    public int? StartPreferenceDurationMinutes { get; set; }

    /// <summary>
    /// True when the point was placed among the day's other points rather than at a
    /// time chosen for it: its time is only where it was put, after whatever came
    /// before it, and a calendar may move it. Null or false for a time chosen
    /// exactly. The same for the three points after it.
    /// </summary>
    public bool? StartPreferenceTimeIsRelative { get; set; }

    public DateTime? StartDeadlineUTC { get; set; }

    public int? StartDeadlineDurationMinutes { get; set; }

    public bool? StartDeadlineTimeIsRelative { get; set; }

    public Guid? EndDependencyTagGroupID { get; set; }

    public DateTime? EndPreferenceUTC { get; set; }

    public int? EndPreferenceDurationMinutes { get; set; }

    public bool? EndPreferenceTimeIsRelative { get; set; }

    public DateTime? EndDeadlineUTC { get; set; }

    public int? EndDeadlineDurationMinutes { get; set; }

    public bool? EndDeadlineTimeIsRelative { get; set; }
}