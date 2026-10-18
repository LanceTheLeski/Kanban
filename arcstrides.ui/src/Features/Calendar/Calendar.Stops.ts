/**
 * Calendar.Stops.ts
 *
 * Every point in time a set of cards have set: each timeline point of each
 * card, and of each of its tasks, as a stop, in time order.
 *
 * A timeline holds up to four points — preferred and required, start and end
 * (see Timeline.Nodes) — and each can last a while. A card has a timeline of
 * its own as well as its tasks', so a stop's task is null when the point is
 * the card's. The day overlay's timeline draws them on a rail, its Cards panel
 * lists each under its card (cardsOnDay), and the date picker under a timeline
 * node draws a day's stops on an hour scale, so all three read the same list
 * from here.
 *
 * ── A card's own points ──────────────────────────────────────────────────────
 * Only a card that keeps dates of its own has points of its own here. One that
 * takes its tasks' (Timeline.Inheritance) is due when they are, so its points
 * are its tasks' and listing them again as the card's would say everything
 * twice. Either way a task's points are its own, and a task is always shown
 * under its card — see cardsOnDay.
 *
 * ── Which cards ──────────────────────────────────────────────────────────────
 * A deadline belongs to a task, not to a day, so the tasks due on a day are
 * not only the tasks on the cards put on it. They are found among every card
 * the calendar can read: the day's own, and those of the boards it knows
 * (see useCalendarBoards). The same card can come from both, so they are merged first.
 */

import dayjs, { type Dayjs } from 'dayjs'
import { NODES, isTimed, modeOf, type NodeSpec } from '../Board/Timeline/Timeline.Nodes'
import { overridesTasks } from '../Board/Timeline/Timeline.Inheritance'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Task } from '../../Entities/Task/Task.Types'
import type { Timeline } from '../../Entities/Timeline/Timeline.Types'

export interface Stop
{
    /** The task the point is on; null for a point on the card's own timeline. */
    task: Task | null

    card: Card

    node: NodeSpec

    at: Dayjs

    /** False for a point set with a date and no time of day — see isTimed. */
    timed: boolean

    /** How long it lasts from `at`, in minutes; null for an instant. */
    duration: number | null
}

/** What is being scheduled, whose own saved points a picker leaves out. */
export interface Subject
{
    kind: 'card' | 'task'

    id: string
}

/**
 * A point as it stands in an editor, not saved yet: what a preview of the day
 * draws beside the saved stops, so a time can be seen in place before it is
 * kept.
 */
export interface PendingPoint
{
    key: string

    /** The point's name: "Deadline", "Preferred start". */
    name: string

    /** What it is the point of: the card's or the task's title. */
    title: string

    at: Dayjs

    timed: boolean

    duration: number | null
}

/**
 * Every timeline point of these cards and of their tasks, earliest first. A
 * card's own points only where it keeps dates of its own — see the header.
 */
export function stopsOf(cards: Card[]): Stop[]
{
    return cards
        .flatMap(card =>
        [
            ...(overridesTasks(card)
                ? timelinePoints(card.timeline, card, null)
                : []),
            ...card.tasks.flatMap(task => timelinePoints(task.timeline, card, task)),
        ])
        .sort(byTime)
}

/**
 * One card on a day, with why it is there and what of it falls on the day.
 *
 * A day lists cards, never tasks on their own: a task is always shown under its
 * card. A card is on a day when it was put on the day by hand, when it keeps
 * dates of its own that fall on the day, or when any of its tasks has a point
 * on the day — whatever the card's own dates say.
 */
export interface DayCardEntry
{
    card: Card

    /** Put on the day by hand, as opposed to only being due on it. */
    placed: boolean

    /** The card's own points on the day — only a card keeping its own dates has any. */
    own: Stop[]

    /** Its tasks' points on the day. */
    taskPoints: Stop[]

    /**
     * The tasks to show under it: every one, for a card put on the day; the ones
     * with a point on the day, for a card that is only due.
     */
    tasks: Task[]
}

/**
 * The cards on a day: the ones put on it, and the ones due on it from `stops` —
 * the day's points, from every card the calendar can read.
 *
 * In order of their first point with a time; then those due with no time; then
 * those only put on the day, in the order they were put there.
 */
export function cardsOnDay(placed: Card[], stops: Stop[]): DayCardEntry[]
{
    const entries = new Map<string, DayCardEntry>()
    const entryOf = (card: Card) =>
    {
        let entry = entries.get(card.id)
        if (!entry)
        {
            entry = { card, placed: false, own: [], taskPoints: [], tasks: [] }
            entries.set(card.id, entry)
        }
        return entry
    }

    for (const card of placed)
        entryOf(card).placed = true
    for (const stop of stops)
    {
        const entry = entryOf(stop.card)
        if (stop.task)
            entry.taskPoints.push(stop)
        else
            entry.own.push(stop)
    }

    for (const entry of entries.values())
    {
        const due = new Set(entry.taskPoints.map(stop => stop.task!.id))
        entry.tasks = entry.placed
            ? entry.card.tasks
            : entry.card.tasks.filter(task => due.has(task.id))
    }

    return [...entries.values()].sort((a, b) => rank(a) - rank(b))
}

/** Every point of a card's that falls on the day: its own, then its tasks'. */
export function pointsOf(entry: DayCardEntry): Stop[]
{
    return [...entry.own, ...entry.taskPoints].sort(byTime)
}

/** The stops of these cards that fall on a day, earliest first. */
export function stopsOn(cards: Card[], day: Dayjs): Stop[]
{
    return stopsOf(cards).filter(stop => stop.at.isSame(day, 'day'))
}

/** One copy of each card across several lists; where a card is in more than one, the later list's copy is kept. */
export function uniqueCards(...lists: Card[][]): Card[]
{
    return [...new Map(lists.flat().map(card => [card.id, card])).values()]
}

/** One copy of each stop — a task's point — in time order. */
export function uniqueStops(stops: Stop[]): Stop[]
{
    return [...new Map(stops.map(stop => [stopKey(stop), stop])).values()].sort(byTime)
}

/**
 * What a stop's point is called: "Deadline" for a timeline whose only point is
 * its deadline, as the timeline panel calls it, and the point's full name — the
 * rail's — for a timeline of several.
 */
export function pointName(stop: Stop): string
{
    return stop.node.id === 'requiredEnd' && modeOf(stop.task?.timeline ?? stop.card.timeline) === 'deadline'
        ? 'Deadline'
        : stop.node.label.join(' ')
}

/** What identifies a stop: its task or its card, and which of the points it is. */
export function stopKey(stop: Stop): string
{
    return `${stop.task?.id ?? `card:${stop.card.id}`}:${stop.node.id}`
}

/** What a stop is the point of, by name: its task's title, or its card's. */
export function stopTitle(stop: Stop): string
{
    return stop.task?.title ?? stop.card.title
}

/** Its task's type, for its colour; a card's own point has none. */
export function stopTypeId(stop: Stop): number | null
{
    return stop.task?.taskType?.id ?? null
}

export function stopDone(stop: Stop): boolean
{
    return stop.task?.isCompleted === true
}

/** Whether a stop is one of the subject's own points. */
export function isSubjects(stop: Stop, subject: Subject | undefined): boolean
{
    if (!subject)
        return false
    return subject.kind === 'task'
        ? stop.task?.id === subject.id
        : stop.task === null && stop.card.id === subject.id
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A card's or a task's timeline, as stops. */
function timelinePoints(timeline: Timeline | null, card: Card, task: Task | null): Stop[]
{
    if (!timeline)
        return []
    return NODES.flatMap(node =>
    {
        const seeded = node.seed(timeline)
        if (!seeded)
            return []
        const at = dayjs(seeded)
        return [{ task, card, node, at, timed: isTimed(at), duration: node.seedDuration(timeline) }]
    })
}

function byTime(a: Stop, b: Stop): number
{
    return a.at.valueOf() - b.at.valueOf()
}

/**
 * Where an entry sorts: by its first point with a time, then due with no time,
 * then only put on the day. Large constants keep the three groups apart.
 */
function rank(entry: DayCardEntry): number
{
    const points = pointsOf(entry)
    const timed = points.find(stop => stop.timed)
    if (timed)
        return timed.at.valueOf()
    return points.length > 0
        ? Number.MAX_SAFE_INTEGER - 1
        : Number.MAX_SAFE_INTEGER
}
