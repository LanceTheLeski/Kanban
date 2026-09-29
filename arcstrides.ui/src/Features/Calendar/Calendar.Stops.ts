/**
 * Calendar.Stops.ts
 *
 * Every point in time the tasks on a day's cards have set: each timeline point
 * of each task, as a stop, in time order.
 *
 * A task's timeline holds up to four points — preferred and required, start
 * and end (see Timeline.Nodes). The day overlay's timeline draws every one of
 * them on a rail, and its connections list the other days those points fall
 * on, so both read the same list from here.
 */

import dayjs, { type Dayjs } from 'dayjs'
import { NODES, type NodeSpec } from '../Board/Timeline/Timeline.Nodes'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Task } from '../../Entities/Task/Task.Types'

export interface Stop {
    task: Task
    card: Card
    node: NodeSpec
    at: Dayjs
}

/** Every timeline point of every task on these cards, earliest first. */
export function stopsOf(cards: Card[]): Stop[] {
    return cards
        .flatMap(card => card.tasks.flatMap(task => NODES.flatMap(node => {
            const at = task.timeline ? node.seed(task.timeline) : null
            return at ? [{ task, card, node, at: dayjs(at) }] : []
        })))
        .sort((a, b) => a.at.valueOf() - b.at.valueOf())
}
