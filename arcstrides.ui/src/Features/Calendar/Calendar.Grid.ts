/**
 * Calendar.Grid.ts
 *
 * Lays a month out as weeks of seven, Sunday first.
 *
 * ── What it replaced ─────────────────────────────────────────────────────────
 * CalendarLayout.OnInitializedAsync built the grid by hand for one month: it
 * asked for January 2025 by name, then padded the front with the tail of
 * December 2024 and the back with the head of February 2025, also by name. So
 * the page could only ever draw that one month, whatever the month ID it had
 * fetched said.
 *
 * Here the month comes from the stored dates themselves, and the grid is worked
 * out from it: which weekday the 1st falls on, how many days there are, and so
 * how many weeks it needs — four, five or six.
 *
 * ── The days either side are not drawn ───────────────────────────────────────
 * The Blazor grid filled the leading and trailing slots with the neighbouring
 * months' days, drawn exactly like this month's. With nothing to tell them
 * apart, the 30th of December read as part of January. Here those slots are
 * null, and MonthGrid leaves them as bare glass: the month is the card, and the
 * card stops where the month does.
 */

import dayjs, { type Dayjs } from 'dayjs'
import type { CalendarDate, Month } from './Calendar.Types'

/** Sunday first, as DayOfTheWeekOrder counted them (Sunday = 0). */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export interface GridDay {
    /** 'YYYY-MM-DD'. A React key, and what a day's overlay is opened by. */
    key: string
    date: Dayjs
    /** The stored row for this day, if the API has one. */
    stored: CalendarDate | null
    isToday: boolean
}

export interface Week {
    key: string
    /** Seven slots, Sunday first. Null where the slot belongs to another month. */
    days: (GridDay | null)[]
    /** The first and last slot holding a day of this month. */
    first: number
    last: number
}

/**
 * The first of the month the stored dates belong to, or null when none of them
 * says — an empty month, or rows whose MonthName could not be read.
 */
export function monthStart(month: Month): Dayjs | null {
    const dated = month.dates.find(date => date.month !== null && date.year !== null)
    if (!dated) return null
    return dayjs(new Date(dated.year!, dated.month!, 1))
}

/**
 * The month starting at `start`, as weeks.
 *
 * A stored date is matched to its day by DateOrder. One that names a different
 * month or year is left off rather than drawn on the wrong day: it is a row
 * that belongs to another month, and this grid has no slot that is honestly
 * its own.
 */
export function weeksOf(start: Dayjs, dates: CalendarDate[], today: Dayjs = dayjs()): Week[] {
    const byDay = new Map(dates
        .filter(date => (date.month === null || date.month === start.month())
                        && (date.year === null || date.year === start.year()))
        .map(date => [date.day, date]))

    const count = start.daysInMonth()
    const lead = start.day()
    const weeks: Week[] = []

    for (let slot = 0; slot < lead + count; slot += 7) {
        const days = Array.from({ length: 7 }, (_, index): GridDay | null => {
            const day = slot + index - lead + 1
            if (day < 1 || day > count) return null

            const date = start.date(day)
            return {
                key: date.format('YYYY-MM-DD'),
                date,
                stored: byDay.get(day) ?? null,
                isToday: date.isSame(today, 'day'),
            }
        })

        const first = days.findIndex(day => day !== null)
        const last = days.length - 1 - [...days].reverse().findIndex(day => day !== null)
        weeks.push({ key: days[first]!.key, days, first, last })
    }

    return weeks
}

/** The day a key names, if it is in these weeks. */
export function dayOf(weeks: Week[], key: string): GridDay | null {
    for (const week of weeks)
        for (const day of week.days)
            if (day?.key === key) return day
    return null
}
