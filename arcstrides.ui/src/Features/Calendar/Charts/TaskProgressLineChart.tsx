/**
 * TaskProgressLineChart
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
 *
 * ── The counts, at the end of the lines ──────────────────────────────────────
 * After the lines, a block of each type's colour with how many tasks of that
 * type the day has — the total only, not the done:
 *
 *     ╱‾‾‾‾‾‾‾‾‾‾  ┌──┬─┬─┐
 *    ╱  ‾‾‾‾‾‾‾‾  │ 5│2│1│      five types: two rows of three places, the
 *   ╱__________   │  │3│1│      largest count taking two, so the blocks fill
 *                 └──┴─┴─┘
 *
 * Two rows, and as many columns as half the types, rounded up; with an odd
 * number of types the one with the most tasks takes a whole column, so there is
 * no hole — one type is a single tall block, three are a tall one and two
 * squares, eleven are six columns. The largest comes first; the rest keep the
 * palette's order, column by column. Each number is written in whichever ink
 * reads on its colour (isLight). The blocks are squares while the tile is wide
 * enough, and narrow, rather than squeezing the lines out, when it is not.
 *
 * It replaces a "4/8" that was once in the tile's corner — a second, smaller
 * chart competing with the first. The blocks are the first chart's legend as
 * well: the colours are the lines'.
 */

import React from 'react'
import { Box } from '@mui/material'
import { MONO } from '../../../Styles/Fonts'
import { isLight } from '../../../Styles/Stock'
import type { TypeSlice } from '../Calendar.Stats'

interface TaskProgressLineChartProps
{
    slices: TypeSlice[]
}

export const TaskProgressLineChart: React.FC<TaskProgressLineChartProps> = ({ slices }) =>
{
    const summary = slices.map(slice => `${slice.title} ${slice.done} of ${slice.count}`).join(', ')

    return (
        <Box role="img"
             aria-label={slices.length === 0
                 ? 'No tasks'
                 : `Progress by type: ${summary}`}
             sx={{ display: 'flex', gap: '5px', width: '100%', height: '100%', minHeight: 28 }}>
            <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Box component="svg"
                 viewBox={`0 0 ${W} ${H}`}
                 preserveAspectRatio="none"
                 sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                {/* The scale: all done along the top, none along the bottom. */}
                <line x1={0} x2={W} y1={yOf(1)} y2={yOf(1)} stroke="rgba(52, 36, 20, 0.12)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <line x1={0} x2={W} y1={yOf(0)} y2={yOf(0)} stroke="rgba(52, 36, 20, 0.28)" strokeWidth={1} vectorEffect="non-scaling-stroke" />

                { slices.map(slice =>
                {
                    const d = pathOf(slice.count === 0
                        ? 0
                        : slice.done / slice.count)
                    return (
                        <g key={slice.key}>
                            {/* The halo, in the tile's colour, under the line. */}
                            <path d={d} fill="none" strokeWidth={4.5}
                                  // In style, not the attribute: a presentation
                                  // attribute is not reliably allowed a var().
                                  style={{ stroke: 'var(--arc-paper, var(--arc-cream))' }}
                                  strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            <path d={d} fill="none" stroke={slice.colour} strokeWidth={2}
                                  strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            {/* A wide invisible stroke to hover, bigger than the line. */}
                            <path d={d} fill="none" stroke="transparent" strokeWidth={10} vectorEffect="non-scaling-stroke">
                                <title>{ `${slice.title}: ${slice.done} of ${slice.count} done` }</title>
                            </path>
                        </g>
                    )
                })
                }
            </Box>

            {/*
                The end dots, in HTML rather than in the SVG: the SVG is stretched
                to its tile, and a circle inside it would be stretched with it.
            */}
            { slices.map(slice =>
                         (
                             <Box key={slice.key}
                                  aria-hidden
                                  sx={{ position: 'absolute',
                                        right: 0,
                                        top: `${(yOf(slice.count === 0
                                            ? 0
                                            : slice.done / slice.count) / H) * 100}%`,
                                        width: 6,
                                        height: 6,
                                        transform: 'translate(50%, -50%)',
                                        borderRadius: '50%',
                                        backgroundColor: slice.colour,
                                        boxShadow: '0 0 0 1.5px var(--arc-paper, var(--arc-cream))'
                                     }} />
                         ))
            }
            </Box>

            <CountBlocks slices={slices} />
        </Box>
    )
}

export default TaskProgressLineChart

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The drawing's own units; the SVG stretches them to its tile. */
const W = 100
const H = 40

/** Room above all-done and below none, so a line on either edge is not clipped. */
const PAD = 4

/** Height for a share done, 0 at the baseline and 1 at the top rule. */
function yOf(ratio: number): number
{
    return H - PAD - ratio * (H - 2 * PAD)
}

/**
 * Up from the bottom-left corner, easing into its level by the middle, then
 * level to the right-hand edge. A cubic with both handles at the quarter mark
 * gives the ease in and out of the rise.
 */
function pathOf(ratio: number): string
{
    const base = yOf(0)
    const level = yOf(ratio)
    const middle = W * 0.5
    const handle = W * 0.25
    return `M 0 ${base} C ${handle} ${base}, ${handle} ${level}, ${middle} ${level} L ${W} ${level}`
}

/** Each type's count for the day, as blocks of its colour — see the header. */
function CountBlocks({ slices }: { slices: TypeSlice[] })
{
    const shown = slices.filter(slice => slice.count > 0)
    if (shown.length === 0)
        return null

    // With an odd number of types, the largest takes a whole column, so the two rows fill.
    const tall = shown.length % 2 === 1
        ? shown.reduce((largest, slice) => (slice.count > largest.count
            ? slice
            : largest))
        : null
    const ordered = tall
        ? [tall, ...shown.filter(slice => slice !== tall)]
        : shown
    const columns = Math.ceil(shown.length / 2)

    return (
        <Box aria-hidden
             sx={{ flexShrink: 1,
                   height: '100%',
                   aspectRatio: `${columns} / 2`,
                   maxWidth: '55%',
                   display: 'grid',
                   gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
                   gridAutoFlow: 'column',
                   gridAutoColumns: 'minmax(0, 1fr)',
                   gap: '2px'
                }}>
            { ordered.map(slice =>
                          (
                              <Box key={slice.key}
                                   title={`${slice.title}: ${slice.count} ${slice.count === 1
                                       ? 'task'
                                       : 'tasks'}`}
                                   sx={{ gridRow: slice === tall
                                             ? 'span 2'
                                             : undefined,
                                         minWidth: 0,
                                         overflow: 'hidden',
                                         display: 'grid',
                                         placeItems: 'center',
                                         borderRadius: '2px',
                                         backgroundColor: slice.colour,
                                         fontFamily: MONO,
                                         fontSize: '0.55rem',
                                         fontWeight: 700,
                                         lineHeight: 1,
                                         color: isLight(slice.colour)
                                             ? 'arc.onPaperStrong'
                                             : 'var(--arc-cream)'
                                      }}>
                                  { slice.count }
                              </Box>
                          ))
            }
        </Box>
    )
}
