/**
 * Calendar.Context.ts
 *
 * What every day on the grid needs from the month around it: the type colours,
 * the board names, and the ways to open a card, a day or a task.
 *
 * A context rather than props because these pass through MonthGrid and
 * WeekStrip untouched on the way to each day, and a day now has five of them.
 * Threading five props through two components that never read them is how a
 * signature becomes a list nobody can change without editing three files.
 */

import { createContext, useContext } from 'react'
import type { Card } from '../../Entities/Card/Card.Types'
import type { GridDay } from './Calendar.Grid'

export interface CalendarActions {
    /** A task type's colour — see Calendar.Stats. */
    colours: Map<number, string>
    /** A board's name, once it has been read; null until then. */
    boardTitle: (boardId: string) => string | null
    openCard: (card: Card) => void
    /** `adding` opens the day with "+ Add card" already searching. */
    openDay: (day: GridDay, options?: { adding?: boolean }) => void
    /** A task was saved from its popover; the month should be re-read. */
    taskUpdated: () => void
}

export const CalendarContext = createContext<CalendarActions | null>(null)

export function useCalendarActions(): CalendarActions {
    const actions = useContext(CalendarContext)
    if (!actions) throw new Error('useCalendarActions is only for components inside MonthView.')
    return actions
}
