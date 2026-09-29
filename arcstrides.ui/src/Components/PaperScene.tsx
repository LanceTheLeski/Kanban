/**
 * PaperScene
 *
 * The frame every cut-paper picture is drawn in: a sky, and a hairline shadow
 * for each layer to cast on the one behind it. What goes in front of the sky is
 * the caller's — see DayArt for the day types' scenes.
 *
 * ── Cut paper, not illustration ──────────────────────────────────────────────
 * Every layer is a flat shape in one colour from Styles/Scenery, and each casts
 * the same small shadow straight down — the one the card panels cast, at the
 * scale of a picture. No outlines, no gradients inside a shape, no highlights:
 * those would make it a drawing of a scene rather than a scene made of paper.
 * The sky is the one gradient, because it is the one layer that is light rather
 * than a sheet.
 *
 * ── Drawn to be cropped ──────────────────────────────────────────────────────
 * By default a scene fills whatever box it is given, anchored to the bottom and
 * the middle: a wide box keeps the ground and loses sky, a square one keeps the
 * sky and loses the ends. Scenes keep what makes them recognisable in the
 * middle and the lower half.
 */

import React, { useId } from 'react'
import { Box } from '@mui/material'
import { SCENERY } from '../Styles/Scenery'

interface PaperSceneProps {
    /** The drawing's own units. */
    width: number
    height: number
    /** Top and bottom of the sky. */
    sky: [string, string]
    /**
     * Said to a screen reader. Left out where the picture is inside a control
     * whose own name already says what it shows.
     */
    label?: string
    /** Crop to fill the box (the default), or show the whole drawing inside it. */
    fit?: 'slice' | 'meet'
    /** The layers in front of the sky, given the filter that casts their shadows. */
    children: (cut: string) => React.ReactNode
}

export const PaperScene: React.FC<PaperSceneProps> = ({ width, height, sky, label, fit = 'slice', children }) => {
    // An ID for this copy's filter and gradient, so the several scenes on a
    // page never pick up one another's. useId's own characters are not all
    // welcome inside url(#…).
    const id = useId().replace(/[^\w-]/g, '')

    return (
        <Box component="svg"
             viewBox={`0 0 ${width} ${height}`}
             preserveAspectRatio={`xMidYMax ${fit}`}
             role={label ? 'img' : undefined}
             aria-label={label}
             aria-hidden={label ? undefined : true}
             sx={{ display: 'block', width: '100%', height: '100%' }}>
            <defs>
                <filter id={`${id}-cut`} x="-5%" y="-10%" width="110%" height="130%">
                    <feDropShadow dx="0" dy="0.7" stdDeviation="0.6" floodColor={SCENERY.cutShadow} floodOpacity="0.32" />
                </filter>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={sky[0]} />
                    <stop offset="1" stopColor={sky[1]} />
                </linearGradient>
            </defs>

            <rect width={width} height={height} fill={`url(#${id}-sky)`} />

            {children(`url(#${id}-cut)`)}
        </Box>
    )
}

/** A low sun: a disc of gold paper on a paler halo. */
export function Sun({ x, y, cut, size = 1 }: { x: number; y: number; cut: string; size?: number }) {
    return (
        <g filter={cut}>
            <circle cx={x} cy={y} r={11 * size} fill={SCENERY.sunHalo} />
            <circle cx={x} cy={y} r={7.5 * size} fill={SCENERY.sun} />
        </g>
    )
}

export default PaperScene
