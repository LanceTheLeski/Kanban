/**
 * Stock.ts
 *
 * Deriving a piece of card from one colour.
 *
 * A .board-label needs four values — a face, a lit top edge, a shaded bottom
 * and a cut edge — and every caller has exactly one: the colour somebody picked,
 * or the one a ramp handed them. Working the other three out here keeps every
 * label in the app lit from the same angle, and keeps the components down to
 * `style={labelStyle(colour)}`.
 *
 * It lives in Styles rather than beside the ramps in Features/Board because
 * there is no domain in it. The ramps know that columns are blue; this only
 * knows how a sheet of card catches light, which is as true of a swatch in a
 * picker as it is of a column header — and the picker is in Components, which
 * may not reach up into a feature.
 */

import type { CSSProperties } from 'react'

export type Rgb = [number, number, number]

/** The four custom properties .board-label paints itself from. */
export function labelStyle(colour: string): CSSProperties {
    const base = parse(colour) ?? [216, 210, 198]
    return {
        '--arc-label': rgb(base),
        '--arc-label-top': rgb(shift(base, 14)),
        '--arc-label-bottom': rgb(shift(base, -12)),
        '--arc-label-edge': rgba(shift(base, -78), 0.45),
    } as CSSProperties
}

export function rgb([r, g, b]: Rgb): string {
    return `rgb(${r}, ${g}, ${b})`
}

/**
 * Where `index` of `total` falls between the two ends of a ramp.
 *
 * `total - 1` because the ends are inclusive: with four columns the first should
 * be the palest and the fourth the deepest, not three quarters of the way there.
 */
export function rampAt([from, to]: [Rgb, Rgb], index: number, total: number): Rgb {
    const steps = Math.max(total - 1, 1)
    const t = Math.min(Math.max(index, 0), steps) / steps
    return [0, 1, 2].map(i => Math.round(from[i] + (to[i] - from[i]) * t)) as Rgb
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function parse(colour: string): Rgb | null {
    const hex = colour.trim().replace(/^#/, '')
    if (/^[0-9a-f]{3}$/i.test(hex))
        return [...hex].map(c => parseInt(c + c, 16)) as Rgb
    if (/^[0-9a-f]{6}$/i.test(hex))
        return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)) as Rgb

    const parts = colour.match(/-?\d+(\.\d+)?/g)
    if (colour.startsWith('rgb') && parts && parts.length >= 3)
        return parts.slice(0, 3).map(n => clampByte(Number(n))) as Rgb

    return null
}

/** Moves every channel by the same amount, which keeps the hue where it was. */
function shift([r, g, b]: Rgb, by: number): Rgb {
    return [clampByte(r + by), clampByte(g + by), clampByte(b + by)]
}

function rgba([r, g, b]: Rgb, alpha: number): string {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function clampByte(value: number): number {
    return Math.min(255, Math.max(0, Math.round(value)))
}
