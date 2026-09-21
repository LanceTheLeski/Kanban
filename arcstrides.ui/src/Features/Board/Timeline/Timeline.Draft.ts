/**
 * Timeline.Draft
 *
 * What UpdateTimelinePanel collects, and how it becomes what the API stores.
 *
 * The panel keeps dates and times in separate pickers because Blazor's
 * MudDatePicker and MudTimePicker were separate controls. The API takes a single
 * timestamp per field, so the two halves are folded back together here — in one
 * place, since both CreateTaskOverlay and UpdateTaskPopover need it.
 */

import type { PatchOperation } from '../../../Lib/Client'
import type { TimelineMode } from './Timeline.Nodes'

/**
 * Structured output the panel sends its parent on every change.
 *
 * It lives here rather than on the panel because it is the contract between the
 * panel and everything downstream of it — CreateTaskOverlay, UpdateTaskPopover
 * and the folding below all speak it, and only one of them draws anything. It
 * replaces the Blazor version's @ref-based field access.
 */
export interface TimelineDraft {
    mode: TimelineMode
    preferredStart: Date | null
    preferredEnd: Date | null
    requiredStart: Date | null
    requiredEnd: Date | null
    preferredStartTime: string | null // HH:MM
    preferredEndTime: string | null
    requiredStartTime: string | null
    requiredEndTime: string | null
}

export interface TimelineDates {
    startPreferenceUTC: Date | null
    startDeadlineUTC: Date | null
    endPreferenceUTC: Date | null
    endDeadlineUTC: Date | null
}

/**
 * Maps the panel's draft onto the four timestamps the API stores.
 * "Preferred" dates are the soft range; "required" dates are the hard deadlines —
 * matching the aquamarine/goldenrod split on the rail.
 */
export function draftToTimelineDates(draft: TimelineDraft): TimelineDates {
    return {
        startPreferenceUTC: combine(draft.preferredStart, draft.preferredStartTime),
        endPreferenceUTC: combine(draft.preferredEnd, draft.preferredEndTime),
        startDeadlineUTC: combine(draft.requiredStart, draft.requiredStartTime),
        endDeadlineUTC: combine(draft.requiredEnd, draft.requiredEndTime),
    }
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
export function hasTimeline(draft: TimelineDraft | null): draft is TimelineDraft {
    return draft !== null && draft.mode !== 'timeless'
}

export function timelineOperations(dates: TimelineDates): PatchOperation[] {
    return [
        { op: 'replace', path: '/startPreferenceUTC', value: dates.startPreferenceUTC?.toISOString() ?? null },
        { op: 'replace', path: '/startDeadlineUTC', value: dates.startDeadlineUTC?.toISOString() ?? null },
        { op: 'replace', path: '/endPreferenceUTC', value: dates.endPreferenceUTC?.toISOString() ?? null },
        { op: 'replace', path: '/endDeadlineUTC', value: dates.endDeadlineUTC?.toISOString() ?? null },
    ]
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Folds a picker date and its "HH:mm" time into one instant. */
function combine(date: Date | null, time: string | null): Date | null {
    if (!date) return null
    if (!time) return date

    const [hours, minutes] = time.split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return date

    const combined = new Date(date)
    combined.setHours(hours, minutes, 0, 0)
    return combined
}
