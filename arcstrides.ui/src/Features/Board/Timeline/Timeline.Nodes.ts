/**
 * Timeline.Nodes
 *
 * The four points a schedule can carry, and which of them each mode puts in
 * play.
 *
 * Separated from the panel because this is the *shape* of a timeline, while
 * UpdateTimelinePanel is one way of editing it. The calendar will want the same
 * four points and the same labels without any of the rail.
 */

import dayjs, { type Dayjs } from 'dayjs'
import type { Timeline } from '../../../Entities/Timeline/Timeline.Types'

export type TimelineMode = 'timeline' | 'deadline' | 'timeless'

export type NodeId = 'preferredStart' | 'requiredStart' | 'preferredEnd' | 'requiredEnd'

export interface NodeSpec
{
    id: NodeId

    /** Two words, stacked under the dot. */
    label: [string, string]

    /** What it means, for the node's tooltip. */
    meaning: string

    /** Which timeline field seeds it. */
    seed: (timeline: Timeline) => Date | null

    /** And how long it lasts, in minutes — see NodeValue. */
    seedDuration: (timeline: Timeline) => number | null

    /** And whether its time was placed in the day's order — see NodeValue. */
    seedRelative: (timeline: Timeline) => boolean
}

/**
 * In the order they occur, which is also the order they are drawn.
 *
 * Required start before preferred start reads oddly as a list and correctly as
 * a line: the hard "must not start before" sits outside the soft "would like to
 * start". Preferred first is the order that was asked for, so that is the order
 * kept.
 */
export const NODES: NodeSpec[] =
[
    {
        id: 'preferredStart',
        label: ['Preferred', 'Start'],
        meaning: 'When this would ideally begin',
        seed: timeline => timeline.startPreferenceUTC,
        seedDuration: timeline => timeline.startPreferenceDurationMinutes,
        seedRelative: timeline => timeline.startPreferenceTimeIsRelative,
    },
    {
        id: 'requiredStart',
        label: ['Required', 'Start'],
        meaning: 'The latest this can begin',
        seed: timeline => timeline.startDeadlineUTC,
        seedDuration: timeline => timeline.startDeadlineDurationMinutes,
        seedRelative: timeline => timeline.startDeadlineTimeIsRelative,
    },
    {
        id: 'preferredEnd',
        label: ['Preferred', 'End'],
        meaning: 'When this would ideally be finished',
        seed: timeline => timeline.endPreferenceUTC,
        seedDuration: timeline => timeline.endPreferenceDurationMinutes,
        seedRelative: timeline => timeline.endPreferenceTimeIsRelative,
    },
    {
        id: 'requiredEnd',
        label: ['Required', 'End'],
        meaning: 'The hard deadline',
        seed: timeline => timeline.endDeadlineUTC,
        seedDuration: timeline => timeline.endDeadlineDurationMinutes,
        seedRelative: timeline => timeline.endDeadlineTimeIsRelative,
    },
]

/**
 * Which nodes a mode puts in play.
 *
 * The modes are kept from the Blazor original because they are a real
 * distinction, but they now say which points exist rather than which of three
 * layouts to render — which is why splitting this panel by mode would have been
 * the wrong cut. There is one control; the mode only changes how much of it is
 * live.
 */
export const NODES_FOR: Record<TimelineMode, NodeId[]> =
{
    timeless: [],
    deadline: ['requiredEnd'],
    timeline: ['preferredStart', 'requiredStart', 'preferredEnd', 'requiredEnd'],
}

/**
 * The three modes, each cut from its own stock.
 *
 * `stock` names a .paper-* class rather than a palette entry, because a tab is
 * a piece of card and the class carries the grain and the lighting with the
 * colour. Which one is chosen is said by lifting it — .card-stock rather than
 * .card-stock-flat — not by filling it, so the three read as one control with a
 * piece pushed forward rather than as two off and one on.
 */
export const MODES: { value: TimelineMode; label: string; stock: string }[] =
[
    { value: 'deadline', label: 'Deadline', stock: 'paper-yellow' },
    { value: 'timeline', label: 'Timeline', stock: 'paper-green' },
    { value: 'timeless', label: 'Timeless', stock: 'paper-red' },
]

// ── What a node is set to ─────────────────────────────────────────────────────

/** One node, as the pickers hold it: its day, its time, and how long it lasts. */
export interface NodeValue
{
    date: Dayjs | null

    time: Dayjs | null

    /**
     * Minutes, from the point's time — "starting takes about two hours". Null for
     * a point that is an instant. A point with no time can still last a while:
     * a two-hour job, some time that day.
     */
    duration: number | null

    /**
     * The time was placed among the day's other points — "after lunch" — rather
     * than chosen: it is where the point was put, not a time anybody asked for.
     * False for a time chosen exactly, and for no time. See DatePickerTimeStep.
     */
    relative: boolean
}

export type NodeValues = Record<NodeId, NodeValue>

export const EMPTY: NodeValues =
{
    preferredStart: { date: null, time: null, duration: null, relative: false },
    requiredStart: { date: null, time: null, duration: null, relative: false },
    preferredEnd: { date: null, time: null, duration: null, relative: false },
    requiredEnd: { date: null, time: null, duration: null, relative: false },
}

/**
 * Seeds the four nodes from a stored timeline.
 *
 * Both halves of a node come from the same instant: the API stores one
 * timestamp per field and the pickers split it back apart. An instant at
 * midnight has no time half — see isTimed.
 */
export function seedValues(timeline: Timeline | null): NodeValues
{
    if (!timeline)
        return EMPTY

    const seeded = { ...EMPTY }
    for (const node of NODES)
    {
        const at = node.seed(timeline)
        if (at)
            seeded[node.id] = { date: dayjs(at),
                                time: isTimed(dayjs(at))
                                    ? dayjs(at)
                                    : null,
                                duration: node.seedDuration(timeline),
                                relative: isTimed(dayjs(at)) && node.seedRelative(timeline) }
    }
    return seeded
}

/**
 * Whether a point carries a time of day, or only a date.
 *
 * The API stores one timestamp per point, with nowhere to say "no time". A point
 * given a date and no time is stored at that date's local midnight — which is
 * what Timeline.Draft's combine has always done — so midnight is read back as no
 * time. Choosing 00:00 means the same thing, and the pickers say so. See
 * docs/timeline-model.md, "A point with no time".
 */
export function isTimed(at: Dayjs): boolean
{
    return at.hour() !== 0 || at.minute() !== 0 || at.second() !== 0 || at.millisecond() !== 0
}

/** How long a point lasts, as it reads: "15 min", "1 h", "1 h 30", "2 h". */
export function durationLabel(minutes: number): string
{
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    if (hours === 0)
        return `${rest} min`
    return rest === 0
        ? `${hours} h`
        : `${hours} h ${String(rest).padStart(2, '0')}`
}

/**
 * What a time placed in the day's order carries wherever it is shown: it is
 * where the point was put — after whatever came before it — not a time anybody
 * chose. See NodeValue.relative.
 */
export const RELATIVE_MARK = '≈'

/**
 * A point's time as it reads: "15:00", or "15:00–17:00" when it lasts — with
 * RELATIVE_MARK before it when the time was placed rather than chosen; for a
 * point with no time, how long it lasts, if anything — "2 h".
 */
export function spanLabel(time: Dayjs | null, duration: number | null, relative = false): string
{
    if (!time)
        return duration
            ? durationLabel(duration)
            : ''
    const mark = relative
        ? RELATIVE_MARK
        : ''
    return duration
        ? `${mark}${time.format('HH:mm')}–${time.add(duration, 'minute').format('HH:mm')}`
        : `${mark}${time.format('HH:mm')}`
}

/**
 * Recovers the mode from the dates, because the server does not store it.
 *
 * Mirrors Blazor's OnInitialized() isTimeless / isDeadline() logic: preference
 * dates mean somebody drew a range, a bare deadline means they did not, and no
 * timeline at all means timeless. See Timeline.Draft for why storing the mode
 * was never an option.
 */
export function modeOf(timeline: Timeline | null): TimelineMode
{
    // A timeline whose points were all taken off is still a row, with an ID to
    // patch; it is timeless all the same.
    if (!timeline || NODES.every(node => !node.seed(timeline)))
        return 'timeless'
    return timeline.startPreferenceUTC || timeline.endPreferenceUTC
        ? 'timeline'
        : 'deadline'
}
