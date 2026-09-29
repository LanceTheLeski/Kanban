/**
 * DiscNumber
 *
 * A day's number in gold foil, as large as its disc will take: the corners of
 * the figures all but touching the disc's edge.
 *
 * ── Fitted to the ink, not to a font size ────────────────────────────────────
 * A font size says how big the type's box is, not how big the figures are, and
 * the numerals face (Styles/Fonts) is a list of fallbacks — Modern No. 20 where
 * Office put it, Bodoni or Didot elsewhere, Georgia at worst — whose figures are
 * different widths and heights at the same size. So the number is measured as
 * drawn, ink edge to ink edge, in whichever face this machine uses, and sized
 * so that box's diagonal is the disc's diameter less a hairline.
 *
 * Every day of the month is set at one size — the size at which the widest of
 * them, usually a "28" or a "20", fits — so the two-figure days all but touch
 * their discs and the single figures sit in theirs at the same size. Fitted one
 * by one, a "1" would stand nearly as tall as its disc beside a "31" half its
 * height, and a month of them reads as a ransom note.
 *
 * The ink box is then centred in the disc. The type's own box would not do:
 * figures sit on the baseline with the room for descenders under them, and a
 * line box centred in a disc puts the figures above its middle.
 */

import React from 'react'
import { Typography } from '@mui/material'
import { NUMERALS } from '../../Styles/Fonts'

interface DiscNumberProps {
    value: number
    /** The disc's diameter, in px. */
    disc: number
}

export const DiscNumber: React.FC<DiscNumberProps> = ({ value, disc }) => {
    const fit = fitted(String(value), disc * (1 - 2 * MARGIN))

    return (
        <Typography component="span"
                    className="gold-foil"
                    sx={{ fontFamily: NUMERALS,
                          fontWeight: WEIGHT,
                          fontSize: `${fit.size}px`,
                          lineHeight: 1,
                          position: 'relative',
                          left: `${fit.left}px`,
                          top: `${fit.top}px` }}>
            {value}
        </Typography>
    )
}

export default DiscNumber

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** How far inside the edge the figures stop, as a share of the diameter a side. */
const MARGIN = 0.05

const WEIGHT = 700

interface Fit {
    size: number
    /** How far to move the figures so their ink, not their box, is centred. */
    left: number
    top: number
}

/**
 * The size at which every day's number fits a circle `room` px across, and
 * where to put `text` so its own ink is centred at that size.
 */
function fitted(text: string, room: number): Fit {
    const key = `${text}:${room}`
    const known = fits.get(key)
    if (known) return known

    const ink = measure(text)
    const scale = room / widestDay()
    const fit: Fit = ink && Number.isFinite(scale)
        ? { size: SAMPLE * scale, left: ink.offsetX * scale, top: ink.offsetY * scale }
        // No canvas to measure with: a size that suits two figures in most faces.
        : { size: room * 0.62, left: 0, top: 0 }

    fits.set(key, fit)
    return fit
}

const fits = new Map<string, Fit>()

let widest: number | undefined

/** The largest ink diagonal of any day's number, 1 to 31, at SAMPLE px. */
function widestDay(): number {
    if (widest === undefined) {
        const diagonals = Array.from({ length: 31 }, (_, index) => measure(String(index + 1)))
            .flatMap(ink => ink ? [Math.hypot(ink.width, ink.height)] : [])
        widest = diagonals.length > 0 ? Math.max(...diagonals) : Infinity
    }
    return widest
}

/** Measured at this size, and scaled from it. */
const SAMPLE = 100

let context: CanvasRenderingContext2D | null | undefined

/**
 * The ink box of `text` at SAMPLE px, and how far its centre is from the
 * centre of the span it will be set in — a span as wide as the text's advance,
 * and as tall as its font size, since the line height is 1.
 */
function measure(text: string): { width: number; height: number; offsetX: number; offsetY: number } | null {
    if (context === undefined) context = document.createElement('canvas').getContext('2d')
    if (!context) return null

    context.font = `${WEIGHT} ${SAMPLE}px ${NUMERALS}`
    const metrics = context.measureText(text)
    const left = metrics.actualBoundingBoxLeft
    const right = metrics.actualBoundingBoxRight
    const ascent = metrics.actualBoundingBoxAscent
    const descent = metrics.actualBoundingBoxDescent
    if (!(right + left > 0 && ascent + descent > 0)) return null

    // The baseline sits where the font's own ascent and descent, centred in a
    // line box one font size tall, put it.
    const baseline = (SAMPLE + metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2
    const inkCentreX = (right - left) / 2
    const inkCentreY = baseline - (ascent - descent) / 2

    return {
        width: left + right,
        height: ascent + descent,
        offsetX: metrics.width / 2 - inkCentreX,
        offsetY: SAMPLE / 2 - inkCentreY,
    }
}
