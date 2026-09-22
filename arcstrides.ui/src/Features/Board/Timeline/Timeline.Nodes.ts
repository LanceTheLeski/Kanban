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

export interface NodeSpec {
    id: NodeId
    /** Two words, stacked under the dot. */
    label: [string, string]
    /** What it means, for the node's tooltip. */
    meaning: string
    /** Which timeline field seeds it. */
    seed: (timeline: Timeline) => Date | null
}

/**
 * In the order they occur, which is also the order they are drawn.
 *
 * Required start before preferred start reads oddly as a list and correctly as
 * a line: the hard "must not start before" sits outside the soft "would like to
 * start". Preferred first is the order that was asked for, so that is the order
 * kept.
 */
export const NODES: NodeSpec[] = [
    {
        id: 'preferredStart',
        label: ['Preferred', 'Start'],
        meaning: 'When this would ideally begin',
        seed: timeline => timeline.startPreferenceUTC,
    },
    {
        id: 'requiredStart',
        label: ['Required', 'Start'],
        meaning: 'The latest this can begin',
        seed: timeline => timeline.startDeadlineUTC,
    },
    {
        id: 'preferredEnd',
        label: ['Preferred', 'End'],
        meaning: 'When this would ideally be finished',
        seed: timeline => timeline.endPreferenceUTC,
    },
    {
        id: 'requiredEnd',
        label: ['Required', 'End'],
        meaning: 'The hard deadline',
        seed: timeline => timeline.endDeadlineUTC,
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
export const NODES_FOR: Record<TimelineMode, NodeId[]> = {
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
export const MODES: { value: TimelineMode; label: string; stock: string }[] = [
    { value: 'deadline', label: 'Deadline', stock: 'paper-yellow' },
    { value: 'timeline', label: 'Timeline', stock: 'paper-green' },
    { value: 'timeless', label: 'Timeless', stock: 'paper-red' },
]

// ── What a node is set to ─────────────────────────────────────────────────────

/** One node's two halves, as the pickers hold them. */
export interface NodeValue {
    date: Dayjs | null
    time: Dayjs | null
}

export type NodeValues = Record<NodeId, NodeValue>

export const EMPTY: NodeValues = {
    preferredStart: { date: null, time: null },
    requiredStart: { date: null, time: null },
    preferredEnd: { date: null, time: null },
    requiredEnd: { date: null, time: null },
}

/**
 * Seeds the four nodes from a stored timeline.
 *
 * Both halves of a node come from the same instant: the API stores one
 * timestamp per field and the pickers split it back apart.
 */
export function seedValues(timeline: Timeline | null): NodeValues {
    if (!timeline) return EMPTY

    const seeded = { ...EMPTY }
    for (const node of NODES) {
        const at = node.seed(timeline)
        if (at) seeded[node.id] = { date: dayjs(at), time: dayjs(at) }
    }
    return seeded
}

/**
 * Recovers the mode from the dates, because the server does not store it.
 *
 * Mirrors Blazor's OnInitialized() isTimeless / isDeadline() logic: preference
 * dates mean somebody drew a range, a bare deadline means they did not, and no
 * timeline at all means timeless. See Timeline.Draft for why storing the mode
 * was never an option.
 */
export function modeOf(timeline: Timeline | null): TimelineMode {
    if (!timeline) return 'timeless'
    return timeline.startPreferenceUTC || timeline.endPreferenceUTC ? 'timeline' : 'deadline'
}
