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
import type { Tag } from '../../Entities/Tag/Tag.Types'
import type { GridDay } from './Calendar.Grid'
import type { Stop } from './Calendar.Stops'
import type { TaskEdit } from '../Board/Task/Task.Staging'

export interface CalendarActions
{
    /** A task type's colour — see Calendar.Stats. */
    colours: Map<number, string>

    /** A board's name, once it has been read; null until then. */
    boardTitle: (boardId: string) => string | null

    openCard: (card: Card) => void

    /** `adding` opens the day with "+ Add card" already searching. */
    openDay: (day: GridDay, options?: { adding?: boolean }) => void

    /** A task was saved from its popover; the month should be re-read. */
    taskUpdated: () => void

    /**
     * Inside the day overlay: holds a task edited from one of the day's notes
     * until the day's Save, rather than writing it (useDayDraft). Absent on the
     * grid, where a task's popover writes on its own Save.
     */
    stageTask?: (card: Card, edit: TaskEdit) => void

    /** Sets what kind of day it is — see Calendar.DayTypes. A failure is reported, not thrown. */
    setDayType: (day: GridDay, typeId: number) => void

    /** Gives the day these tags, writing the difference. A failure is reported, not thrown. */
    setDayTags: (day: GridDay, tags: Tag[]) => void

    /**
     * Opens another day, in its overlay — moving the calendar to that day's
     * month first, if it is not this one.
     */
    goToDay: (date: Dayjs) => void

    /**
     * Every card the calendar can read: the month's, and those on the boards it
     * knows — where a day's deadlines are found. See useCalendarBoards and Calendar.Stops.
     */
    knownCards: Card[]

    /** Every timeline point on a day of the month, by day key, from `knownCards`. */
    stopsOnDay: (dayKey: string) => Stop[]

    /** While the boards are first read, and a day's deadlines may not all be in yet. */
    readingBoards: boolean
}

export const CalendarContext = createContext<CalendarActions | null>(null)

export function useCalendarActions(): CalendarActions
{
    const actions = useContext(CalendarContext)
    if (!actions)
        throw new Error('useCalendarActions is only for components inside MonthView.')

    return actions
}