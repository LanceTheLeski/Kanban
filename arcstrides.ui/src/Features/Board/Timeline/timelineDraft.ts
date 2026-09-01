/**
 * timelineDraft.ts
 *
 * Converts what UpdateTimelinePanel collects into what the timeline API stores.
 *
 * The panel keeps dates and times in separate pickers because Blazor's
 * MudDatePicker and MudTimePicker were separate controls. The API takes a single
 * timestamp per field, so the two halves are folded back together here — in one
 * place, since both CreateTaskOverlay and UpdateTaskPopover need it.
 */

import type { PatchOperation } from '../../../APIs/Client'
import type { TimelineDraft } from './UpdateTimelinePanel'

export interface TimelineDates {
    startPreferenceUTC: Date | null
    startDeadlineUTC: Date | null
    endPreferenceUTC: Date | null
    endDeadlineUTC: Date | null
}

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

/**
 * Maps the panel's draft onto the four timestamps the API stores.
 * "Preferred" dates are the soft range; "required" dates are the hard deadlines —
 * matching the aquamarine/goldenrod split in UpdateTimelinePanel.
 */
export function draftToTimelineDates(draft: TimelineDraft): TimelineDates {
    return {
        startPreferenceUTC: combine(draft.preferredStart, draft.preferredStartTime),
        endPreferenceUTC: combine(draft.preferredEnd, draft.preferredEndTime),
        startDeadlineUTC: combine(draft.requiredStart, draft.requiredStartTime),
        endDeadlineUTC: combine(draft.requiredEnd, draft.requiredEndTime),
    }
}

/** Timeline type IDs as the server's TimelineType enum orders them. */
export function timelineTypeIdFor(draft: TimelineDraft): number {
    return draft.mode === 'deadline' ? 1 : 0
}

/** A draft only describes a real timeline once it is out of Timeless mode. */
export function hasTimeline(draft: TimelineDraft | null): draft is TimelineDraft {
    return draft !== null && draft.mode !== 'timeless'
}

export function timelineOperations(dates: TimelineDates): PatchOperation[] {
    return [
        { op: 'replace', path: '/StartPreferenceUTC', value: dates.startPreferenceUTC?.toISOString() ?? null },
        { op: 'replace', path: '/StartDeadlineUTC', value: dates.startDeadlineUTC?.toISOString() ?? null },
        { op: 'replace', path: '/EndPreferenceUTC', value: dates.endPreferenceUTC?.toISOString() ?? null },
        { op: 'replace', path: '/EndDeadlineUTC', value: dates.endDeadlineUTC?.toISOString() ?? null },
    ]
}
