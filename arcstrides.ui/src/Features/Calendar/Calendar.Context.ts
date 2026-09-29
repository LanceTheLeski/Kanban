/**
 * Calendar.Context.ts
 *
 * What every day on the grid needs from the month around it: the type colours,
 * the board names, the ways to open a card, a day or a task, and the ways to
 * change a day.
 *
 * A context rather than props because these pass through MonthGrid untouched
 * on the way to each day, and a day now has nine of them. Threading nine props
 * through a component that never reads them is how a signature becomes a list
 * nobody can change without editing three files.
 */

import { createContext, useContext } from 'react'
import type { Dayjs } from 'dayjs'
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
    /** Sets what kind of day it is — see Calendar.DayTypes. A failure is reported, not thrown. */
    setDayType: (day: GridDay, typeId: number) => void
    /** Moves the day's unfinished cards to the next working day — see Calendar.Moves. */
    carryOver: (day: GridDay) => void
    /** The day unfinished cards would be carried to. */
    carryTarget: (day: GridDay) => Dayjs
    /**
     * Opens another day, in its overlay — moving the calendar to that day's
     * month first, if it is not this one.
     */
    goToDay: (date: Dayjs) => void
}

export const CalendarContext = createContext<CalendarActions | null>(null)

export function useCalendarActions(): CalendarActions {
    const actions = useContext(CalendarContext)
    if (!actions) throw new Error('useCalendarActions is only for components inside MonthView.')
    return actions
}
