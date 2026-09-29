/**
 * Palette.ts
 *
 * Every colour the app's paper is cut from: four hues, each in three steps,
 * and the few neutral stocks. The one place these are written down.
 *
 * ── The ladders ──────────────────────────────────────────────────────────────
 * Each hue is a ladder of three steps of the same hue, measured in OKLCH so
 * that a step means the same lightness whichever hue it is on:
 *
 *   ground   L ≈ .90   the pale papers — panels, tiles, the day's stock
 *   mid      L ≈ .72   about the weight of ink — rails, chips, strong tiles
 *   deep     L ≈ .40   text on colour, dark tiles, the ground gold sits on
 *
 * Kept to roughly 60 / 30 / 10: mostly grounds, some mids, and the deeps as
 * accents. Yellow carries more colour at every step than the others, the way
 * yellows have to before they read as yellow rather than as beige.
 *
 * ── Gold and oxblood are on the ladders, not beside them ─────────────────────
 * They were the two colours that did not belong: gold was about twice as
 * saturated as any other stock, which is why it jumped off every page, and
 * oxblood was the only dark in the set. Here gold is the yellow mid and
 * oxblood the red deep, so each has a family: gold sits at the weight of the
 * blue ink, and oxblood is the red paper's own darkest step.
 *
 * ── How the rest of the app reads them ───────────────────────────────────────
 *   CSS           as custom properties — PALETTE_VARIABLES, set on :root by
 *                 App.tsx; ArcStyles.css cuts its stocks from those
 *   the MUI theme the hex values, since MUI works colours out from them
 *   drawings     the hex values, for SVG fills — see DayArt
 *
 * Chart colours are not here. A task type's colour has to be told apart from
 * seven others at a glance, which a paper palette of four soft hues cannot do;
 * they stay the validated categorical set in Calendar.Stats.
 */

export interface Ladder {
    ground: string
    mid: string
    deep: string
}

export const LADDERS = {
    blue: { ground: '#cfdfef', mid: '#79aad8', deep: '#295074' },
    green: { ground: '#cfe6dc', mid: '#6cb69a', deep: '#175a45' },
    red: { ground: '#f1cac3', mid: '#d59185', deep: '#70322b' },
    yellow: { ground: '#ecdca6', mid: '#cfac5f', deep: '#5c4b14' },
} as const satisfies Record<string, Ladder>

export type Hue = keyof typeof LADDERS

/** The stocks with no hue to speak of. */
export const NEUTRALS = {
    /** Plain card: unbleached board, warm off-white. */
    cream: '#f6f1e4',
    /** The swimlanes' card. */
    sand: '#eee3ca',
    /** Greyboard, the unprinted stock. */
    grey: '#c3bfb6',
    /** A sticky note: the palest yellow, on the ladder's hue. */
    note: '#fdf6d8',
} as const

/** The steps that have names of their own in the stocks. */
export const INK = LADDERS.blue.mid
export const NAVY = LADDERS.blue.deep
export const GOLD = LADDERS.yellow.mid
export const OXBLOOD = LADDERS.red.deep

/**
 * On a pane of glass rather than on paper: the ground steps, which are light
 * enough to read against it. Gold's own ground for the action a bar leads
 * with, and a red just past its ground for the one that deletes.
 */
export const ON_GLASS = {
    accent: LADDERS.yellow.ground,
    danger: '#f3b8ad',
} as const

/**
 * The palette as CSS custom properties — `--arc-blue-ground`, `--arc-gold`,
 * `--arc-cream` — for App.tsx to set on :root, so ArcStyles.css never states a
 * colour of its own.
 */
export const PALETTE_VARIABLES: Record<string, string> = {
    ...Object.fromEntries(Object.entries(LADDERS).flatMap(([hue, ladder]) =>
        Object.entries(ladder).map(([step, colour]) => [`--arc-${hue}-${step}`, colour]))),
    ...Object.fromEntries(Object.entries(NEUTRALS).map(([name, colour]) => [`--arc-${name}`, colour])),
    '--arc-ink': INK,
    '--arc-navy': NAVY,
    '--arc-gold': GOLD,
    '--arc-oxblood': OXBLOOD,
    '--arc-accent-on-glass': ON_GLASS.accent,
    '--arc-danger-on-glass': ON_GLASS.danger,
}
