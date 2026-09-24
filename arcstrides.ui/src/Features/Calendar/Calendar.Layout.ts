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
 * A day's floor. Tall enough on a wide screen for three notes and the count
 * under them; on a phone a day is forty pixels wide and holds a number and a
 * tally, so it is allowed to be short.
 */
export const DAY_MIN_HEIGHT = { xs: rem(56), sm: rem(118), md: rem(136) }

/**
 * Notes drawn in a day before the rest become "+ n more". Three is what fits
 * the floor above without a day growing taller than its neighbours for one
 * busy date.
 */
export const NOTES_PER_DAY = 3

/** Below this a day is too narrow for a title, and shows a count instead. */
export const NOTES_FROM = 'sm'
