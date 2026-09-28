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
 * A day's floor: the header, the view row and a card, on a desktop. On a phone
 * a day is forty pixels wide and holds a number and a tally, so it may be short.
 */
export const DAY_MIN_HEIGHT = { xs: rem(56), sm: rem(118), md: rem(150) }

/**
 * The ceiling on a day's cards before they scroll — the Blazor date's 120px
 * carousel, given more room. Without one, the busiest day would set the height
 * of its whole week.
 */
export const DAY_BODY_MAX_HEIGHT = { sm: rem(170), md: rem(210) }

/** Below this a day is too narrow for its header and cards, and shows a count. */
export const NOTES_FROM = 'sm'
