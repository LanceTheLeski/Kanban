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
 * while — its `…DurationMinutes`, from its time — and can have been placed in the
 * day's order rather than at a time — its `…TimeIsRelative`.
 */

export interface Timeline
{
    id: string | null

    startDependencyTagGroupId: string | null

    startPreferenceUTC: Date | null

    /** How long the point lasts from its time, in minutes; null for an instant. Likewise for the other three. */
    startPreferenceDurationMinutes: number | null

    /**
     * The point was placed among the day's other points, not at a time chosen for
     * it: its time is where it was put — after whatever came before it — and not a
     * time anybody asked for. Likewise for the other three. See DatePickerTimeStep.
     */
    startPreferenceTimeIsRelative: boolean

    startDeadlineUTC: Date | null

    startDeadlineDurationMinutes: number | null

    startDeadlineTimeIsRelative: boolean

    endDependencyTagGroupId: string | null

    endPreferenceUTC: Date | null

    endPreferenceDurationMinutes: number | null

    endPreferenceTimeIsRelative: boolean

    endDeadlineUTC: Date | null

    endDeadlineDurationMinutes: number | null

    endDeadlineTimeIsRelative: boolean
}
