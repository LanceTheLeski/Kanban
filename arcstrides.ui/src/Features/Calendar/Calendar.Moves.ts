/**
 * Calendar.Moves.ts
 *
 * Where a day's unfinished work goes when it is carried over, and which of its
 * cards count as unfinished.
 *
 * Carrying over is the one quick action that is about more than the day it is
 * on, so the rules for it are here rather than in the menu: a card is carried
 * if anything on it is still to do, and it lands on the next day that expects
 * work — the next day whose type is a working one (see Calendar.DayTypes). A
 * vacation's cards skip the rest of the vacation, and a Friday's skip a weekend
 * marked Leisure.
 */

import type { Dayjs } from 'dayjs'
import { dayTypeOf } from './Calendar.DayTypes'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Month } from './Calendar.Types'

/** Cards with anything left to do — a card with no tasks yet counts. */
export function unfinished(cards: Card[]): Card[] {
    return cards.filter(card => card.tasks.length === 0 || card.tasks.some(task => !task.isCompleted))
}

/**
 * The first working day after `from`. Days of the month on screen are judged
 * by their type; past its end the types are not known, so the next day is
 * taken as it comes.
 */
export function nextWorkingDay(from: Dayjs, stored: Month | null): Dayjs {
    for (let ahead = 1; ahead <= LOOK_AHEAD; ahead += 1) {
        const day = from.add(ahead, 'day')
        if (!stored || day.month() !== stored.month || day.year() !== stored.year) return day

        const typeId = stored.dates.find(date => date.day === day.date())?.typeId
        if (dayTypeOf(typeId).working) return day
    }
    return from.add(1, 'day')
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A month of days off in a row, and the search gives up and takes tomorrow. */
const LOOK_AHEAD = 31
