/**
 * Calendar.Layout.ts
 *
 * The month grid's geometry, for the same reason Board.Layout exists: the
 * weekday glass is laid over the week strips by a separate element, and the two
 * only line up while they agree on the gap.
 */

import { rem } from '../../Styles/Measures'

/**
 * Between two weekdays, and between two weeks — in theme spacing units, so
 * 8px. The same as the board's, so the two pages are cut from the same sheet.
 */
export const CALENDAR_GAP = 1

/**
 * A day's height on the grid — fixed, not a floor. Every day of a week is the
 * same height whatever is on it, and what does not fit scrolls inside the day
 * (see GridDayCell), so one busy day does not stretch its whole week and push
 * the rest of the month down the page.
 *
 * On a phone a day is forty pixels wide and holds its number, a count of its
 * cards — on yellow when one of them is due — and its picture's strip.
 */
export const DAY_HEIGHT = { xs: rem(80), sm: rem(156), md: rem(196) }

/** Below this a day is too narrow for its header and cards, and shows a count. */
export const NOTES_FROM = 'sm'
