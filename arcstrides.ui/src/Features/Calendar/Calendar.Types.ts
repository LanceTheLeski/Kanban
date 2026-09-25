/**
 * Calendar domain types.
 *
 * Mirrors: ArcStrides.UI.Legacy/Models/Calendar/Date.cs, minus the four chart
 * fields (DonutChartData, LineChartData, Labels, xAxisLabels). Those were filled
 * with `//todo` in CalendarLayout and drew empty charts; there is nothing here
 * for them to hold until something computes them.
 *
 * ── What is not carried across ───────────────────────────────────────────────
 * DateResponse also sends WeekOrder and DayOfTheWeekOrder. Both are facts about
 * the date that the date already knows, so the grid works them out from the date
 * itself — see Calendar.Grid. Keeping the stored copies would give the page two
 * answers to "which column is the 1st in", and nothing to do if they disagreed.
 */

import type { Card } from '../../Entities/Card/Card.Types'

/** One stored day of a month, and the cards the server placed on it. */
export interface CalendarDate {
    id: string
    /** Day of the month, from 1. DateOrder on the wire. */
    day: number
    /** From 0, the way dayjs counts. Recovered from MonthName; null if that failed. */
    month: number | null
    year: number | null
    cards: Card[]
}

/**
 * What the API holds for one calendar month.
 *
 * Only the days something has been put on have rows, so `dates` is usually a
 * handful and often empty — the grid draws every day from the calendar itself
 * and lays these on top. `id` is null until the first thing is added, since a
 * month's ID is born with its first row.
 */
export interface Month {
    id: string | null
    year: number
    /** From 0, the way dayjs counts. */
    month: number
    dates: CalendarDate[]
}
