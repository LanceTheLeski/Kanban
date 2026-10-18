/**
 * Timeline.Draft
 *
 * What UpdateTimelinePanel collects, and how it becomes what the API stores.
 *
 * The panel keeps dates and times in separate pickers because Blazor's
 * MudDatePicker and MudTimePicker were separate controls. The API takes a single
 * timestamp per field, so the two halves are folded back together here — in one
 * place, since both CreateTaskPopover and UpdateTaskPopover need it.
 */

import type { PatchOperation } from '../../../Lib/Client'
import { createTimeline, updateTimeline } from '../Board.APIs'
import type { Timeline } from '../../../Entities/Timeline/Timeline.Types'
import { NODES_FOR, modeOf, seedValues, type NodeId, type NodeValues, type TimelineMode } from './Timeline.Nodes'

/**
 * Structured output the panel sends its parent on every change.
 *
 * It lives here rather than on the panel because it is the contract between the
 * panel and everything downstream of it — CreateTaskPopover, UpdateTaskPopover
 * and the folding below all speak it, and only one of them draws anything. It
 * replaces the Blazor version's @ref-based field access.
 */
export interface TimelineDraft
{
    mode: TimelineMode

    preferredStart: Date | null

    preferredEnd: Date | null

    requiredStart: Date | null

    requiredEnd: Date | null

    preferredStartTime: string | null // HH:MM

    preferredEndTime: string | null

    requiredStartTime: string | null

    requiredEndTime: string | null

    /** How long each point lasts from its time, in minutes; null for an instant. */
    preferredStartDuration: number | null

    preferredEndDuration: number | null

    requiredStartDuration: number | null

    requiredEndDuration: number | null
}

export interface TimelineDates
{
    startPreferenceUTC: Date | null

    startDeadlineUTC: Date | null

    endPreferenceUTC: Date | null

    endDeadlineUTC: Date | null

    startPreferenceDurationMinutes: number | null

    startDeadlineDurationMinutes: number | null

    endPreferenceDurationMinutes: number | null

    endDeadlineDurationMinutes: number | null
}

/**
 * Maps the panel's draft onto the four timestamps the API stores.
 * "Preferred" dates are the soft range; "required" dates are the hard deadlines —
 * matching the aquamarine/goldenrod split on the rail.
 */
export function draftToTimelineDates(draft: TimelineDraft): TimelineDates
{
    return {
        startPreferenceUTC: combine(draft.preferredStart, draft.preferredStartTime),
        endPreferenceUTC: combine(draft.preferredEnd, draft.preferredEndTime),
        startDeadlineUTC: combine(draft.requiredStart, draft.requiredStartTime),
        endDeadlineUTC: combine(draft.requiredEnd, draft.requiredEndTime),
        // A duration belongs to a point: with no day, there is nothing for it to last from.
        startPreferenceDurationMinutes: draft.preferredStart
            ? draft.preferredStartDuration
            : null,
        endPreferenceDurationMinutes: draft.preferredEnd
            ? draft.preferredEndDuration
            : null,
        startDeadlineDurationMinutes: draft.requiredStart
            ? draft.requiredStartDuration
            : null,
        endDeadlineDurationMinutes: draft.requiredEnd
            ? draft.requiredEndDuration
            : null,
    }
}

/**
 * The draft for a set of node values in a mode: four date+time pairs, with
 * anything the mode does not put in play reported as null rather than as
 * whatever it was last set to — switching to Timeless has to clear the
 * schedule, not hide it. What the timeline panel reports as it changes.
 */
export function draftOf(values: NodeValues, mode: TimelineMode): TimelineDraft
{
    const on = NODES_FOR[mode]
    const dateOf = (id: NodeId) => (on.includes(id)
        ? values[id].date?.toDate() ?? null
        : null)
    const timeOf = (id: NodeId) => (on.includes(id)
        ? values[id].time?.format('HH:mm') ?? null
        : null)
    const durationOf = (id: NodeId) => (on.includes(id)
        ? values[id].duration
        : null)

    return {
        mode,
        preferredStart: dateOf('preferredStart'),
        preferredStartTime: timeOf('preferredStart'),
        requiredStart: dateOf('requiredStart'),
        requiredStartTime: timeOf('requiredStart'),
        preferredEnd: dateOf('preferredEnd'),
        preferredEndTime: timeOf('preferredEnd'),
        requiredEnd: dateOf('requiredEnd'),
        requiredEndTime: timeOf('requiredEnd'),
        preferredStartDuration: durationOf('preferredStart'),
        requiredStartDuration: durationOf('requiredStart'),
        preferredEndDuration: durationOf('preferredEnd'),
        requiredEndDuration: durationOf('requiredEnd'),
    }
}

/**
 * A saved timeline as a draft, as if every point had been set by hand: for a
 * card that starts keeping dates of its own from the ones it inherited, so they
 * are saved as its own even if nothing is changed.
 */
export function draftFromTimeline(timeline: Timeline | null): TimelineDraft
{
    return draftOf(seedValues(timeline), modeOf(timeline))
}

/**
 * What a timeline is parented to.
 *
 * ── This is not the mode ─────────────────────────────────────────────────────
 * TimelineTypeID was being sent as `mode === 'deadline' ? 1 : 0`, as though it
 * described the *shape* of the timeline. The server reads it as the *kind of
 * parent*: TimelineRepository.ParentExistsAsync switches on it with `case 1: //
 * Card` and `case 2: // Task`, and anything else falls to `default: return
 * false`, which CreateTimeline turns into "Parent not found".
 *
 * So Timeline mode sent 0, hit the default, and was rejected before a row was
 * ever written — which is why deadlines could be saved and full timelines could
 * not. Deadline mode sent 1 and was accepted, having told the server its task
 * was a card.
 *
 * The mode is not something the server stores, and does not need to be: it is
 * recoverable from the dates. A timeline with preference dates is a timeline,
 * one with only a deadline is a deadline, and no dates at all is timeless —
 * which is exactly how UpdateTimelinePanel decides what to show when it loads
 * one back.
 *
 * The enum's own doc comment says it carries both facts at once ("Indicates
 * deadline or (proper) timeline. Also indicates Card or Task parent."). It
 * cannot: there is no value meaning "a proper timeline, parented to a task".
 * See docs/timeline-model.md for what to do about that.
 */
export const TIMELINE_PARENT_CARD = 1
export const TIMELINE_PARENT_TASK = 2

/** A draft only describes a real timeline once it is out of Timeless mode. */
export function hasTimeline(draft: TimelineDraft | null): draft is TimelineDraft
{
    return draft !== null && draft.mode !== 'timeless'
}

export function timelineOperations(dates: TimelineDates): PatchOperation[]
{
    return [
        { op: 'replace', path: '/startPreferenceUTC', value: dates.startPreferenceUTC?.toISOString() ?? null },
        { op: 'replace', path: '/startDeadlineUTC', value: dates.startDeadlineUTC?.toISOString() ?? null },
        { op: 'replace', path: '/endPreferenceUTC', value: dates.endPreferenceUTC?.toISOString() ?? null },
        { op: 'replace', path: '/endDeadlineUTC', value: dates.endDeadlineUTC?.toISOString() ?? null },
        { op: 'replace', path: '/startPreferenceDurationMinutes', value: dates.startPreferenceDurationMinutes },
        { op: 'replace', path: '/startDeadlineDurationMinutes', value: dates.startDeadlineDurationMinutes },
        { op: 'replace', path: '/endPreferenceDurationMinutes', value: dates.endPreferenceDurationMinutes },
        { op: 'replace', path: '/endDeadlineDurationMinutes', value: dates.endDeadlineDurationMinutes },
    ]
}

/**
 * Writes a timeline draft for a card or a task, and returns the timeline as it
 * now stands.
 *
 * One that already exists is patched in place, every point at once, so a
 * point taken off is cleared and Timeless clears them all rather than leaving
 * the last schedule standing. (Until the API wrote nulls on a patch, neither
 * stuck — see TimelinePatchMapper.) One that does not exist yet is created,
 * unless the draft is Timeless and there is nothing to create.
 */
export async function saveTimeline(boardId: string,
                                   parent: { id: string; kind: number },
                                   existing: Timeline | null,
                                   draft: TimelineDraft): Promise<Timeline | null>
{
    const dates = draftToTimelineDates(draft)
    if (existing?.id)
    {
        await updateTimeline(boardId, existing.id, timelineOperations(dates))
        return { ...existing, ...dates }
    }
    if (!hasTimeline(draft))
        return null
    return createTimeline(boardId, { parentId: parent.id, timelineTypeId: parent.kind, ...dates })
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Folds a picker date and its "HH:mm" time into one instant. */
function combine(date: Date | null, time: string | null): Date | null
{
    if (!date)
        return null
    if (!time)
        return date

    const [hours, minutes] = time.split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes))
        return date

    const combined = new Date(date)
    combined.setHours(hours, minutes, 0, 0)
    return combined
}
