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
 * After the lines, a square of blocks: one for each type, in its colour, with
 * how many tasks of that type the day has — the total, not the done:
 *
 *     ╱‾‾‾‾‾‾‾‾‾‾  ┌─────┐
 *    ╱  ‾‾‾‾‾‾‾‾  │  5  │      five types: the largest across the top,
 *   ╱__________   ├──┬──┤      the rest two by two
 *                 │2 │3 │
 *                 ├──┼──┤
 *                 │1 │1 │
 *                 └──┴──┘
 *
 * The square is the same size whatever is in it, so it fits every day's header:
 * two columns, and as many rows as half the types, rounded up, which grow
 * smaller as types are added. With an odd number of types the one with the most
 * tasks takes a whole row, so there is no hole. At most the ten types with the
 * most tasks are there; the rest are still lines and in the ring. The numbers
 * are written in whichever ink reads on each colour (isLight) while a block is
 * big enough to hold one — up to three rows.
 *
 * Pointing at a type — its segment of the ring, its line, or its block — fills
 * the whole square with that type and its count (`hovered`, held by
 * GridDayHeader), which is how a count too small to print is read.
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
    /** A line each — the ring's segments, Other included. */
    slices: TypeSlice[]

    /** Every type on the day, for the count blocks — see DayStats. */
    types: TypeSlice[]

    /** The type pointed at in the day's charts, by key: its block fills the square. */
    hovered?: string | null

    /** A type pointed at here — its line or its block; null when the pointer leaves. */
    onHover?: (key: string | null) => void
}

export const TaskProgressLineChart: React.FC<TaskProgressLineChartProps> = ({ slices, types, hovered = null, onHover }) =>
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
                            <path d={d} fill="none" stroke="transparent" strokeWidth={10} vectorEffect="non-scaling-stroke"
                                  onMouseEnter={() => onHover?.(slice.key)}
                                  onMouseLeave={() => onHover?.(null)}>
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

            <CountBlocks types={types}
                         slices={slices}
                         hovered={hovered}
                         onHover={onHover} />
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

/** As many types as the blocks show: the ones with the most tasks. */
const MOST_BLOCKS = 10

interface CountBlocksProps
{
    types: TypeSlice[]

    /** Where a hovered key not among `types` — Other, from the ring — is found. */
    slices: TypeSlice[]

    hovered: string | null

    onHover?: (key: string | null) => void
}

/** Each type's count for the day, as blocks of its colour in a square — see the header. */
function CountBlocks({ types, slices, hovered, onHover }: CountBlocksProps)
{
    const shown = mostTasks(types.filter(slice => slice.count > 0))
    if (shown.length === 0)
        return null

    const focus = hovered === null
        ? null
        : types.find(slice => slice.key === hovered) ?? slices.find(slice => slice.key === hovered) ?? null

    // With an odd number of types, the largest takes a whole row, so the two columns fill.
    const wide = shown.length % 2 === 1
        ? shown.reduce((largest, slice) => (slice.count > largest.count
            ? slice
            : largest))
        : null
    const ordered = wide
        ? [wide, ...shown.filter(slice => slice !== wide)]
        : shown
    const rows = Math.ceil(shown.length / 2)

    return (
        <Box aria-hidden
             onMouseLeave={() => onHover?.(null)}
             sx={{ flexShrink: 0,
                   height: '100%',
                   aspectRatio: '1 / 1',
                   display: 'grid',
                   gridTemplateColumns: focus
                       ? '1fr'
                       : 'repeat(2, minmax(0, 1fr))',
                   gridTemplateRows: focus
                       ? '1fr'
                       : `repeat(${rows}, minmax(0, 1fr))`,
                   gap: '1.5px'
                }}>
            { focus
                ? <Block slice={focus}
                         fontSize="0.8rem" />
                : ordered.map(slice =>
                              (
                                  <Block key={slice.key}
                                         slice={slice}
                                         wide={slice === wide}
                                         fontSize={NUMBER_SIZES[rows]}
                                         onHover={onHover} />
                              ))
            }
        </Box>
    )
}

/** The types with the most tasks, MOST_BLOCKS at most, in the order they came. */
function mostTasks(types: TypeSlice[]): TypeSlice[]
{
    if (types.length <= MOST_BLOCKS)
        return types
    const kept = new Set([...types].sort((a, b) => b.count - a.count)
                                   .slice(0, MOST_BLOCKS)
                                   .map(slice => slice.key))
    return types.filter(slice => kept.has(slice.key))
}

/** The number's size by how many rows there are; none where a block is too small to hold one. */
const NUMBER_SIZES: Record<number, string | null> = { 1: '0.62rem', 2: '0.55rem', 3: '0.45rem', 4: null, 5: null }

interface BlockProps
{
    slice: TypeSlice

    /** Spans both columns: the largest, with an odd number of types. */
    wide?: boolean

    fontSize: string | null

    onHover?: (key: string | null) => void
}

/** One type's block: its colour, and its count in an ink that reads on it. */
function Block({ slice, wide = false, fontSize, onHover }: BlockProps)
{
    return (
        <Box title={`${slice.title}: ${slice.count} ${slice.count === 1
                 ? 'task'
                 : 'tasks'}`}
             onMouseEnter={() => onHover?.(slice.key)}
             sx={{ gridColumn: wide
                       ? 'span 2'
                       : undefined,
                   minWidth: 0,
                   minHeight: 0,
                   overflow: 'hidden',
                   display: 'grid',
                   placeItems: 'center',
                   borderRadius: '2px',
                   backgroundColor: slice.colour,
                   fontFamily: MONO,
                   fontSize: fontSize ?? 0,
                   fontWeight: 700,
                   lineHeight: 1,
                   color: isLight(slice.colour)
                       ? 'arc.onPaperStrong'
                       : 'var(--arc-cream)'
                }}>
            { fontSize && slice.count }
        </Box>
    )
}
