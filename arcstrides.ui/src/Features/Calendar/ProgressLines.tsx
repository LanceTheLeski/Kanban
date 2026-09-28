/**
 * ProgressLines
 *
 * How far along each task type is on a day: one line per type, all starting
 * bottom-left, each levelling out at the height of its own share done.
 *
 * Mirrors: the MudChart line chart on each Blazor date, and the idea behind it.
 * There, each type's series was [0, 0, r, r, r, r] against a hidden series of
 * tens that pinned the axis — a line that stayed at zero, rose, and then held
 * level at its completion ratio r from the middle to the right-hand edge. Drawn
 * straight from (0, 0) to (1, r), every type would have been a diagonal and the
 * types would only have differed in slope, which is hard to compare and dull to
 * look at. Levelling out puts the value in the one place the eye compares best:
 * a height, against the others', at the right-hand edge.
 *
 * Kept from that: the start at zero, the rise, the level run to the edge, one
 * line per type in the type's colour. Changed: the rise is a smooth ease rather
 * than a kink, the lines are drawn over a thin halo of the tile's own colour so
 * one stays readable where it crosses another, and each ends in a dot at its
 * value. The x axis carries no data — it is the run-up — so there are no ticks
 * on it; the scale is 0 at the baseline and all done at the faint top rule.
 *
 * Every value is also readable without the lines: the tooltip on each, and the
 * day overlay's table of types with done / total.
 */

import React from 'react'
import { Box } from '@mui/material'
import { MONO } from '../../Styles/Fonts'
import type { TypeSlice } from './Calendar.Stats'

interface ProgressLinesProps {
    slices: TypeSlice[]
    done: number
    total: number
    /** Show "done/total" in the top-left corner. */
    showCount?: boolean
    /** Line and dot weight — heavier for the overlay's larger chart. */
    weight?: 'small' | 'large'
}

export const ProgressLines: React.FC<ProgressLinesProps> = ({ slices, done, total, showCount = true, weight = 'small' }) => {
    const large = weight === 'large'
    const summary = slices.map(slice => `${slice.title} ${slice.done} of ${slice.count}`).join(', ')

    return (
        <Box role="img"
             aria-label={total === 0 ? 'No tasks' : `Progress by type: ${summary}`}
             sx={{ position: 'relative', width: '100%', height: '100%', minHeight: large ? 72 : 28 }}>
            <Box component="svg"
                 viewBox={`0 0 ${W} ${H}`}
                 preserveAspectRatio="none"
                 sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                {/*
                    The scale: all done along the top, none along the bottom. The
                    top rule starts clear of the count in the corner, or it would
                    strike it through.
                */}
                <line x1={showCount && total > 0 ? W * 0.3 : 0} x2={W} y1={yOf(1)} y2={yOf(1)} stroke="rgba(52, 36, 20, 0.12)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <line x1={0} x2={W} y1={yOf(0)} y2={yOf(0)} stroke="rgba(52, 36, 20, 0.28)" strokeWidth={1} vectorEffect="non-scaling-stroke" />

                {slices.map(slice => {
                    const d = pathOf(slice.count === 0 ? 0 : slice.done / slice.count)
                    return (
                        <g key={slice.key}>
                            {/* The halo, in the tile's colour, under the line. */}
                            <path d={d} fill="none" strokeWidth={large ? 6 : 4.5}
                                  // In style, not the attribute: a presentation
                                  // attribute is not reliably allowed a var().
                                  style={{ stroke: 'var(--arc-paper, #f6f1e4)' }}
                                  strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            <path d={d} fill="none" stroke={slice.colour} strokeWidth={large ? 2.5 : 2}
                                  strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            {/* A wide invisible stroke to hover, bigger than the line. */}
                            <path d={d} fill="none" stroke="transparent" strokeWidth={10} vectorEffect="non-scaling-stroke">
                                <title>{`${slice.title}: ${slice.done} of ${slice.count} done`}</title>
                            </path>
                        </g>
                    )
                })}
            </Box>

            {/*
                The end dots, in HTML rather than in the SVG: the SVG is stretched
                to its tile, and a circle inside it would be stretched with it.
            */}
            {slices.map(slice => (
                <Box key={slice.key}
                     aria-hidden
                     sx={{ position: 'absolute',
                           right: 0,
                           top: `${(yOf(slice.count === 0 ? 0 : slice.done / slice.count) / H) * 100}%`,
                           width: large ? 9 : 6,
                           height: large ? 9 : 6,
                           transform: 'translate(50%, -50%)',
                           borderRadius: '50%',
                           backgroundColor: slice.colour,
                           boxShadow: `0 0 0 ${large ? 2 : 1.5}px var(--arc-paper, #f6f1e4)` }} />
            ))}

            {showCount && total > 0 && (
                <Box component="span"
                     sx={{ position: 'absolute',
                           left: 2,
                           top: 0,
                           fontFamily: MONO,
                           fontSize: large ? '0.72rem' : '0.52rem',
                           lineHeight: 1.2,
                           color: 'arc.onPaper',
                           fontVariantNumeric: 'tabular-nums' }}>
                    {done}/{total}
                </Box>
            )}
        </Box>
    )
}

export default ProgressLines

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The drawing's own units; the SVG stretches them to its tile. */
const W = 100
const H = 40

/** Room above all-done and below none, so a line on either edge is not clipped. */
const PAD = 4

/** Height for a share done, 0 at the baseline and 1 at the top rule. */
function yOf(ratio: number): number {
    return H - PAD - ratio * (H - 2 * PAD)
}

/**
 * Up from the bottom-left corner, easing into its level by the middle, then
 * level to the right-hand edge. A cubic with both handles at the quarter mark
 * gives the ease in and out of the rise.
 */
function pathOf(ratio: number): string {
    const base = yOf(0)
    const level = yOf(ratio)
    const middle = W * 0.5
    const handle = W * 0.25
    return `M 0 ${base} C ${handle} ${base}, ${handle} ${level}, ${middle} ${level} L ${W} ${level}`
}
