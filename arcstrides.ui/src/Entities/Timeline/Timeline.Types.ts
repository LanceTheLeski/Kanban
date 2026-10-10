/**
 * Timeline entity.
 *
 * Mirrors: ArcStrides.UI.Legacy/Models/Board/Timeline.cs
 *
 * Shared rather than board-owned: a timeline hangs off a task today, and the
 * Calendar page renders the same dates on a month grid. Nothing about it is
 * specific to the Kanban board.
 *
 * C# Guid → string, C# DateTime → Date | null.
 *
 * UpdateTimelinePanel uses these fields to populate its date/time pickers. The
 * "preference" fields map to the green Timeline mode, the "deadline" fields to
 * the yellow Deadline mode; both null means Timeless. Each point can last a
 * while — its `…DurationMinutes`, from its time.
 */

export interface Timeline
{
    id: string | null

    startDependencyTagGroupId: string | null

    startPreferenceUTC: Date | null

    /** How long the point lasts from its time, in minutes; null for an instant. Likewise for the other three. */
    startPreferenceDurationMinutes: number | null

    startDeadlineUTC: Date | null

    startDeadlineDurationMinutes: number | null

    endDependencyTagGroupId: string | null

    endPreferenceUTC: Date | null

    endPreferenceDurationMinutes: number | null

    endDeadlineUTC: Date | null

    endDeadlineDurationMinutes: number | null
}
