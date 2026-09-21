/**
 * Fonts.ts
 *
 * The font stacks, in one place.
 *
 * They were written inline at each use, and had already drifted: the column
 * headers fell back through three condensed faces while the swimlane labels
 * beside them fell straight to sans-serif, so on a machine without Calibri
 * Condensed the two halves of the same grid were set in different fonts. The
 * monospace stack existed in two versions for the same reason — whichever the
 * nearest file happened to have when the next one was written.
 *
 * A stack is a sequence of fallbacks, which means it is a decision about what
 * happens on a reader's machine rather than a value. Repeating it is how it
 * stops being one decision.
 */

/**
 * Card commands, timeline dates, and anything else meant to read as data.
 *
 * ui-monospace ahead of the generic keyword so a reader without DM Mono gets
 * their system's UI monospace — SF Mono, Cascadia — rather than Courier.
 */
export const MONO = '"DM Mono", ui-monospace, monospace'

/**
 * Column headers and swimlane labels: the grid's own furniture.
 *
 * Condensed because these sit in fixed-width chrome around user-written names,
 * and a narrow face fits more of one before it has to wrap.
 */
export const CONDENSED = "'Calibri Condensed', 'Bodoni MT Condensed', 'Bahnschrift Light Condensed', sans-serif"

/** The board's own title. Decorative, and used nowhere else. */
export const SCRIPT = "'Freestyle Script', cursive"
