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

/**
 * The three custom properties .board-label paints itself from: a face, and the
 * lit and shaded ends of it. There used to be a fourth, for a drawn edge; card
 * has no line round it, so it went — see "How a piece of card is lit".
 */
export function labelStyle(colour: string): CSSProperties
{
    const base = parse(colour) ?? [216, 210, 198]
    return {
        '--arc-label': rgb(base),
        '--arc-label-top': rgb(shift(base, 14)),
        '--arc-label-bottom': rgb(shift(base, -12)),
    } as CSSProperties
}

/**
 * A column's colour as tinted glass: the colour at partial strength, so the
 * frosting under it still shows.
 *
 * .55 because glass that is any more opaque than that reads as painted, and any
 * less loses the pale end of the column ramp against the white film it sits on.
 */
export function glassStyle(colour: string): CSSProperties
{
    const base = parse(colour) ?? [216, 210, 198]
    return { '--arc-glass-tint': rgba(base, 0.55) } as CSSProperties
}

/**
 * Any colour this app stores, as `#rrggbb` — which is the one form the colour
 * picker takes.
 *
 * Stored colours are not all hex: the ramps produce `rgb(…)`, and so did the
 * swatch picker this replaced, so a board coloured before today holds that form.
 * Anything unparseable comes back as the fallback rather than as black, because
 * black is a colour and would be written back on the next save.
 */
export function toHex(colour: string | null | undefined, fallback = '#d8d2c6'): string
{
    const parsed = colour
        ? parse(colour)
        : null
    if (!parsed)
        return fallback
    return '#' + parsed.map(channel => channel.toString(16).padStart(2, '0')).join('')
}

/** A `#rrggbb` palette colour as channels, for a ramp to blend. */
export function rgbOf(colour: string): Rgb
{
    return parse(colour) ?? [216, 210, 198]
}

export function rgb([r, g, b]: Rgb): string
{
    return `rgb(${r}, ${g}, ${b})`
}

/**
 * Where `index` of `total` falls between the two ends of a ramp.
 *
 * `total - 1` because the ends are inclusive: with four columns the first should
 * be the palest and the fourth the deepest, not three quarters of the way there.
 */
export function rampAt([from, to]: [Rgb, Rgb], index: number, total: number): Rgb
{
    const steps = Math.max(total - 1, 1)
    const t = Math.min(Math.max(index, 0), steps) / steps
    return [0, 1, 2].map(i => Math.round(from[i] + (to[i] - from[i]) * t)) as Rgb
}

/**
 * The same colour, `steps` shades lighter (positive) or darker (negative), as
 * `#rrggbb`.
 *
 * A shade is a step in lightness with the hue and saturation kept, so a blue
 * stays the same blue as it pales. The step is about what the ramps take between
 * neighbouring columns on a board of four, so a shade suggested next to a colour
 * reads as the next one along rather than as a different colour. Never quite
 * white or black: a label's name has to stay readable on it.
 */
export function shade(colour: string, steps: number): string
{
    const [h, s, l] = hslOf(rgbOf(colour))
    const lightness = Math.min(Math.max(l + steps * SHADE_STEP, 0.14), 0.94)
    return toHex(rgb(rgbOfHsl(h, s, lightness)))
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function parse(colour: string): Rgb | null
{
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
function shift([r, g, b]: Rgb, by: number): Rgb
{
    return [clampByte(r + by), clampByte(g + by), clampByte(b + by)]
}

function rgba([r, g, b]: Rgb, alpha: number): string
{
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function clampByte(value: number): number
{
    return Math.min(255, Math.max(0, Math.round(value)))
}

/** One shade: seven points of lightness. */
const SHADE_STEP = 0.07

/** Channels as hue (0–1), saturation and lightness. */
function hslOf([r, g, b]: Rgb): [number, number, number]
{
    const [red, green, blue] = [r / 255, g / 255, b / 255]
    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)
    const lightness = (max + min) / 2
    if (max === min)
        return [0, 0, lightness]

    const delta = max - min
    const saturation = lightness > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min)
    const hue = max === red
        ? (green - blue) / delta + (green < blue
            ? 6
            : 0)
        : max === green
            ? (blue - red) / delta + 2
            : (red - green) / delta + 4
    return [hue / 6, saturation, lightness]
}

function rgbOfHsl(hue: number, saturation: number, lightness: number): Rgb
{
    if (saturation === 0)
        return [clampByte(lightness * 255), clampByte(lightness * 255), clampByte(lightness * 255)]

    const q = lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation
    const p = 2 * lightness - q
    return [hue + 1 / 3, hue, hue - 1 / 3].map(t => clampByte(channelOf(p, q, t) * 255)) as Rgb
}

function channelOf(p: number, q: number, t: number): number
{
    const wrapped = t < 0
        ? t + 1
        : t > 1
            ? t - 1
            : t
    if (wrapped < 1 / 6)
        return p + (q - p) * 6 * wrapped
    if (wrapped < 1 / 2)
        return q
    if (wrapped < 2 / 3)
        return p + (q - p) * (2 / 3 - wrapped) * 6
    return p
}
