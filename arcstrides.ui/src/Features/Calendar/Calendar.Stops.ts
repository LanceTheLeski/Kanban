/**
 * Calendar.Stops.ts
 *
 * Every point in time the tasks on a set of cards have set: each timeline point
 * of each task, as a stop, in time order.
 *
 * A task's timeline holds up to four points — preferred and required, start
 * and end (see Timeline.Nodes). The day overlay's timeline draws them on a
 * rail, its Due column lists the ones on the day that have no time, and the
 * date picker under a timeline node draws a day's stops on an hour scale, so
 * all three read the same list from here.
 *
 * ── Which cards ──────────────────────────────────────────────────────────────
 * A deadline belongs to a task, not to a day, so the tasks due on a day are
 * not only the tasks on the cards put on it. They are found among every card
 * the calendar can read: the day's own, and those of the boards it knows
 * (see useBoards). The same card can come from both, so they are merged first.
 */

import dayjs, { type Dayjs } from 'dayjs'
import { NODES, isTimed, modeOf, type NodeSpec } from '../Board/Timeline/Timeline.Nodes'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Task } from '../../Entities/Task/Task.Types'

export interface Stop
{
    task: Task

    card: Card

    node: NodeSpec

    at: Dayjs

    /** False for a point set with a date and no time of day — see isTimed. */
    timed: boolean
}

/** Every timeline point of every task on these cards, earliest first. */
export function stopsOf(cards: Card[]): Stop[]
{
    return cards
        .flatMap(card => card.tasks.flatMap(task => NODES.flatMap(node =>
        {
            const seeded = task.timeline
                ? node.seed(task.timeline)
                : null
            if (!seeded)
                return []
            const at = dayjs(seeded)
            return [{ task, card, node, at, timed: isTimed(at) }]
        })))
        .sort(byTime)
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
 * What a stop's point is called: "Deadline" for a task whose only point is its
 * deadline, as the timeline panel calls it, and the point's full name — the
 * rail's — for a task with a timeline of several.
 */
export function pointName(stop: Stop): string
{
    return stop.node.id === 'requiredEnd' && modeOf(stop.task.timeline) === 'deadline'
        ? 'Deadline'
        : stop.node.label.join(' ')
}

/** What identifies a stop: its task, and which of the task's points it is. */
export function stopKey(stop: Stop): string
{
    return `${stop.task.id}:${stop.node.id}`
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function byTime(a: Stop, b: Stop): number
{
    return a.at.valueOf() - b.at.valueOf()
}
