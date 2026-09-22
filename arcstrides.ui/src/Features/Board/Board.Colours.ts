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

import { labelStyle, rampAt, rgb, type Rgb } from '../../Styles/Stock'

export { labelStyle }

/** The column ramp, palest first. */
const COLUMN_RAMP: [Rgb, Rgb] = [[222, 234, 247], [124, 166, 209]]

/** The swimlane ramp, strongest first. */
const SWIMLANE_RAMP: [Rgb, Rgb] = [[224, 142, 142], [246, 222, 222]]

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
 * The ramp as swatches, for the colour pickers to offer.
 *
 * Six of each, because a picker with a hundred shades of blue asks the reader to
 * make a decision the ramp has already made well enough.
 */
export function columnSwatches(): string[] {
    return Array.from({ length: 6 }, (_, i) => rgb(rampAt(COLUMN_RAMP, i, 6)))
}

export function swimlaneSwatches(): string[] {
    return Array.from({ length: 6 }, (_, i) => rgb(rampAt(SWIMLANE_RAMP, i, 6)))
}
