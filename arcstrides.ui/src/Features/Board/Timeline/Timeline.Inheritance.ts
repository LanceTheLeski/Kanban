/**
 * Timeline.Inheritance
 *
 * A card's schedule, from its tasks'.
 *
 * A card does not need dates of its own: by default it takes its tasks', put
 * together point by point —
 *
 *   preferred start   the earliest of its tasks' preferred starts
 *   required start    the earliest of its tasks' required starts
 *   preferred end     the latest of its tasks' preferred ends
 *   required end      the latest of its tasks' required ends — a task with
 *                     only a deadline has only this point, so a card whose
 *                     tasks are all deadlines is due when the last of them is
 *
 * — so a card is a span from the first thing its tasks start to the last thing
 * they finish, mixing deadlines and timelines however the tasks do. Each point
 * keeps the length of the task point it came from.
 *
 * A card can instead keep dates of its own ("overrides" its tasks): then its own
 * timeline is the one it goes by, and its tasks keep theirs. On the calendar a
 * task always shows under its card, on its own days, whichever the card does.
 *
 * Nothing here is stored: the API keeps a card's own timeline and the flag, and
 * the inherited one is worked out wherever a card is drawn.
 */

import type { Card } from '../../../Entities/Card/Card.Types'
import type { Task } from '../../../Entities/Task/Task.Types'
import type { Timeline } from '../../../Entities/Timeline/Timeline.Types'

/** What a card goes by, and where it came from. */
export interface CardSchedule
{
    /** The dates the card goes by; null for none. */
    timeline: Timeline | null

    /** True when they are its tasks' put together, false when they are its own. */
    inherited: boolean

    /** How many of its tasks have dates — what an inherited schedule is made from. */
    tasksWithDates: number
}

/**
 * Whether a card keeps dates of its own. Never set, a card with a timeline of
 * its own keeps it — so a date someone set on a card before this existed is not
 * quietly replaced by its tasks' — and one without takes its tasks'.
 */
export function overridesTasks(card: Pick<Card, 'overridesTasks' | 'timeline'>): boolean
{
    return card.overridesTasks ?? card.timeline !== null
}

/** The schedule a card goes by: its own, or its tasks' put together. */
export function cardSchedule(card: Card): CardSchedule
{
    const tasksWithDates = card.tasks.filter(task => hasDates(task.timeline)).length
    return overridesTasks(card)
        ? { timeline: card.timeline, inherited: false, tasksWithDates }
        : { timeline: inheritedTimeline(card.tasks), inherited: true, tasksWithDates }
}

/**
 * Tasks' timelines put together point by point: earliest starts, latest ends.
 * Null when none of them has a date.
 */
export function inheritedTimeline(tasks: Task[]): Timeline | null
{
    const timelines = tasks.map(task => task.timeline)
                           .filter((timeline): timeline is Timeline => hasDates(timeline))
    if (timelines.length === 0)
        return null

    const startPreference = pick(timelines, 'startPreferenceUTC', 'earliest')
    const startDeadline = pick(timelines, 'startDeadlineUTC', 'earliest')
    const endPreference = pick(timelines, 'endPreferenceUTC', 'latest')
    const endDeadline = pick(timelines, 'endDeadlineUTC', 'latest')

    return {
        // Not a row of its own: there is nothing to patch.
        id: null,
        startDependencyTagGroupId: null,
        endDependencyTagGroupId: null,
        startPreferenceUTC: startPreference?.startPreferenceUTC ?? null,
        startPreferenceDurationMinutes: startPreference?.startPreferenceDurationMinutes ?? null,
        startDeadlineUTC: startDeadline?.startDeadlineUTC ?? null,
        startDeadlineDurationMinutes: startDeadline?.startDeadlineDurationMinutes ?? null,
        endPreferenceUTC: endPreference?.endPreferenceUTC ?? null,
        endPreferenceDurationMinutes: endPreference?.endPreferenceDurationMinutes ?? null,
        endDeadlineUTC: endDeadline?.endDeadlineUTC ?? null,
        endDeadlineDurationMinutes: endDeadline?.endDeadlineDurationMinutes ?? null,
    }
}

/** A timeline's four points as one string, for keying a component on what it shows. */
export function timelineKey(timeline: Timeline | null): string
{
    if (!timeline)
        return 'none'
    return [timeline.startPreferenceUTC, timeline.startDeadlineUTC, timeline.endPreferenceUTC, timeline.endDeadlineUTC]
        .map(point => point?.getTime() ?? '')
        .join('|')
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function hasDates(timeline: Timeline | null): boolean
{
    return !!timeline && !!(timeline.startPreferenceUTC || timeline.startDeadlineUTC
                            || timeline.endPreferenceUTC || timeline.endDeadlineUTC)
}

type PointField = 'startPreferenceUTC' | 'startDeadlineUTC' | 'endPreferenceUTC' | 'endDeadlineUTC'

/**
 * The timeline with the earliest (or latest) value of one point — the whole
 * timeline, so the point's length comes with it. Null when none has the point.
 */
function pick(timelines: Timeline[], field: PointField, which: 'earliest' | 'latest'): Timeline | null
{
    let chosen: Timeline | null = null
    for (const timeline of timelines)
    {
        const value = timeline[field]
        if (!value)
            continue
        const best = chosen?.[field]
        const better = !best
            || (which === 'earliest'
                ? value.getTime() < best.getTime()
                : value.getTime() > best.getTime())
        if (better)
            chosen = timeline
    }
    return chosen
}
