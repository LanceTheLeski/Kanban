/**
 * TypeRing
 *
 * The ring round a day's number: its tasks, split by type.
 *
 * Mirrors: the MudChart donut in CalendarDate.razor, which sat beside the day's
 * number in a pink circle and was meant to hold it — the commented-out
 * CustomGraphics block there tried to print the number in the donut's middle.
 * Here it does: the ring is drawn round the disc the number is on.
 *
 * Part-to-whole at a glance, which is what a small ring is for; the exact counts
 * are in the day overlay's legend, and in each segment's tooltip. Segments are
 * in palette order, not size order, so a type sits in the same place on every
 * day. A two-pixel gap separates them — left empty, so the ground shows through
 * — rather than a drawn line, and each casts the short shadow of a strip of
 * paper laid on the sheet under it.
 */

import React from 'react'
import { Box } from '@mui/material'
import type { TypeSlice } from './Calendar.Stats'

interface TypeRingProps {
    slices: TypeSlice[]
    /** Outer diameter, in px. */
    size: number
    /** Ring thickness, in px. */
    thickness: number
    children: React.ReactNode
}

export const TypeRing: React.FC<TypeRingProps> = ({ slices, size, thickness, children }) => {
    const total = slices.reduce((sum, slice) => sum + slice.count, 0)
    const radius = (size - thickness) / 2
    const circumference = 2 * Math.PI * radius
    const gap = slices.length > 1 ? GAP : 0

    // Each segment starts where the one before it ended.
    const arcs = slices.reduce<{ slice: TypeSlice; dash: number; offset: number; end: number }[]>((list, slice) => {
        const offset = list.at(-1)?.end ?? 0
        const length = (slice.count / total) * circumference
        return [...list, { slice, dash: Math.max(length - gap, 0.5), offset, end: offset + length }]
    }, [])

    const summary = slices.map(slice => `${slice.title} ${slice.count}`).join(', ')

    return (
        <Box sx={{ position: 'relative',
                   width: size,
                   height: size,
                   flexShrink: 0,
                   display: 'grid',
                   placeItems: 'center' }}>
            {total > 0 && (
                <Box component="svg"
                     role="img"
                     aria-label={`Tasks by type: ${summary}`}
                     viewBox={`0 0 ${size} ${size}`}
                     sx={{ position: 'absolute',
                           inset: 0,
                           width: size,
                           height: size,
                           transform: 'rotate(-90deg)',
                           // Each segment a strip of paper laid on the sheet, with
                           // the cut shadow the tiles beside it cast (.card-cut).
                           // The filter is drawn before the quarter turn, so its
                           // offset is written sideways to land straight down.
                           filter: 'drop-shadow(-1px 0 0.6px rgba(38, 28, 10, .4))' }}>
                    {arcs.map(({ slice, dash, offset: start }) => (
                        <circle key={slice.key}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={slice.colour}
                                strokeWidth={thickness}
                                strokeDasharray={`${dash} ${circumference - dash}`}
                                strokeDashoffset={-start}>
                            <title>{`${slice.title}: ${slice.count} ${slice.count === 1 ? 'task' : 'tasks'}`}</title>
                        </circle>
                    ))}
                </Box>
            )}

            {/* Above the ring, so the number's button is what a click reaches. */}
            <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center' }}>{children}</Box>
        </Box>
    )
}

export default TypeRing

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The surface gap between segments, in px of arc. */
const GAP = 2
