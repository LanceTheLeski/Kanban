/**
 * Board.Colours
 *
 * What colour a column header or a swimlane label is written on.
 *
 * ── Stored first, position second ────────────────────────────────────────────
 * Column and Swimlane have carried ColumnColor/SwimlaneColor on the server model
 * since early on; nothing ever read them, because the contracts did not carry
 * them as far as the client. They do now, so a board that has been given colours
 * uses them.
 *
 * A board that has not still needs to look deliberate, so the fallback is a ramp
 * over position rather than one flat colour:
 *
 *   Columns   blue, palest on the left, deepening to the right — work moving
 *             rightwards through the board gets visibly further along.
 *   Swimlanes red, strongest at the top, fading downwards — the lane you put
 *             first is the one that shouts.
 *
 * Both run between two steps of a ladder in Styles/Palette, ground and mid, so
 * a board's headers and labels are the same papers as the rest of the app.
 *
 * Inserting into the middle re-shades everything after it, which is a known and
 * accepted oddity: the ramp is over the *current* arrangement, not over an
 * identity, because a board with three columns and a board with nine should both
 * use the whole range rather than the first third of it.
 *
 * ── What is here and what is not ─────────────────────────────────────────────
 * The ramps, which are domain: columns are blue and swimlanes are red because
 * that is what this board means by them. Turning one colour into the four a
 * piece of card needs is not domain, so it is in Styles/Stock — which is also
 * the only way the colour picker, a layer below, can share it.
 */

import { labelStyle, rampAt, rgb, rgbOf, type Rgb } from '../../Styles/Stock'
import { LADDERS } from '../../Styles/Palette'

export { labelStyle }

/** The column ramp, palest first: the blue ladder from its ground to its mid. */
const COLUMN_RAMP: [Rgb, Rgb] = [rgbOf(LADDERS.blue.ground), rgbOf(LADDERS.blue.mid)]

/** The swimlane ramp, strongest first: the red ladder from its mid to its ground. */
const SWIMLANE_RAMP: [Rgb, Rgb] = [rgbOf(LADDERS.red.mid), rgbOf(LADDERS.red.ground)]

/**
 * A column's colour: its own if it has one, otherwise its place on the ramp.
 *
 * `total` is how many columns the board has, so the ramp always spans the whole
 * range. One column takes the palest end rather than dividing by zero.
 */
export function columnColour(stored: string | null | undefined, index: number, total: number): string {
    return stored?.trim() || rgb(rampAt(COLUMN_RAMP, index, total))
}

/** A swimlane's colour, on the ramp that runs the other way. */
export function swimlaneColour(stored: string | null | undefined, index: number, total: number): string {
    return stored?.trim() || rgb(rampAt(SWIMLANE_RAMP, index, total))
}

/**
 * Where a column or swimlane being created will land: the position typed into
 * the Order field if there is a usable one, otherwise the end.
 *
 * The create overlays need it before the thing exists, to show the colour the
 * ramp is about to give it.
 */
export function landingIndex(orderInput: string, count: number): number {
    const typed = parseInt(orderInput, 10)
    return Number.isNaN(typed) ? count : Math.min(Math.max(typed, 0), count)
}
