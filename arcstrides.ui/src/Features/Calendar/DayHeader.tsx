/**
 * DayHeader
 *
 * The top of a day, as tiles: the date in its type ring, a tile of progress
 * lines, the quick-actions tile, and the ‹ HEAD › row that changes the view.
 *
 * Mirrors: the top 50px of a Blazor CalendarDate — a donut, a 50px line chart,
 * a column holding the settings and expand icons above ← ALL →. The arrangement
 * is kept; the pieces are cut from card, each tile its own colour, set edge to
 * edge with a hairline of glass between them — the look of a tablet's start
 * screen, in paper.
 *
 *   wide day (a middle-width day moves ⋮ down beside ›)  narrow day
 *   ┌────┬───────────────────┬─┐     ┌────┬──────────┐
 *   │ 30 │   ╱‾‾‾‾‾‾‾‾‾‾‾‾   │⋮│     │ 30 │    ⋮     │
 *   │ring│  ╱  ‾‾‾‾‾‾‾‾‾‾‾   │ │     ├────┴──────────┤
 *   │    │ ╱____________     │ │     │ ╱‾‾‾‾  lines  │
 *   ├─┬──┴───────────────────┴┬┤     ├─┬───────────┬─┤
 *   │‹│         ALL           │›│     │‹│    ALL    │›│
 *   └─┴───────────────────────┴─┘     └─┴───────────┴─┘
 *
 * Blazor's own proportions gave the chart 50px of a 170px day, beside an 80px
 * column of icons over the ALL row. Comparing the types' lines is the point of
 * the chart, so here the icons' column is folded into a slim ⋮ tile and the view
 * row runs the full width underneath, which roughly doubles the chart.
 *
 * The date itself is not on a tile: it is a disc of card already, ringed with
 * its tasks by type, and it sits on the glass the way it always has.
 */

import React from 'react'
import { Box, ButtonBase, IconButton, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { NUMERALS } from '../../Styles/Fonts'
import { TypeRing } from './TypeRing'
import { ProgressLines } from './ProgressLines'
import { DayActions } from './DayActions'
import { useCalendarActions } from './Calendar.Context'
import type { DayStats } from './Calendar.Stats'
import type { DayView } from './Calendar.Views'
import type { GridDay } from './Calendar.Grid'

interface DayHeaderProps {
    day: GridDay
    stats: DayStats
    views: DayView[]
    current: number
    onView: (index: number) => void
    /** The copy inside the day's own overlay: nothing here opens the day again. */
    mini?: boolean
}

export const DayHeader: React.FC<DayHeaderProps> = ({ day, stats, views, current, onView, mini = false }) => {
    const { openDay } = useCalendarActions()
    const name = day.date.format('dddd D MMMM')
    const empty = stats.total === 0 && views.length === 0
    const count = views.length
    const view = views[current]
    const step = (by: number) => onView((current + by + count) % count)

    const number = (
        <Typography component="span"
                    className="gold-foil"
                    sx={{ fontFamily: NUMERALS, fontWeight: 700, fontSize: '0.95rem', lineHeight: 1 }}>
            {day.date.date()}
        </Typography>
    )

    return (
        /*
            Narrow: date and menu, then the lines, then the view row. Wide:
            date | lines | a slim menu tile, over the view row.

            A container query, not a breakpoint: what decides the layout is how
            wide this day is, and the same day is drawn at two widths — on the
            grid, and as the live copy in its overlay. The day sets itself up as
            the container; see DayCell.
        */
        <Box sx={{ display: 'grid',
                   gap: '3px',
                   gridTemplateColumns: 'auto minmax(0, 1fr)',
                   gridTemplateAreas: '"date menu" "chart chart" "nav nav"',
                   gridTemplateRows: 'auto 1.9rem 1.15rem',
                   alignItems: 'stretch',
                   [`@container day (min-width: ${MIDDLE_FROM})`]: {
                       gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                       gridTemplateAreas: '"date chart chart" "nav nav menu"',
                       gridTemplateRows: '2.6rem 1.15rem',
                   },
                   [`@container day (min-width: ${WIDE_FROM})`]: {
                       gridTemplateAreas: '"date chart menu" "nav nav nav"',
                   } }}>
            {/*
                The number, punched out of card and glued down, ringed with its
                tasks by type; the number in gold, as Blazor set it. Today is cut
                from oxblood, the one dark stock, which is where gold reads best —
                it was the ground of Blazor's gold ALL. The disc opens the day,
                except in the day's own overlay, where it is only the date.
            */}
            <Box sx={{ gridArea: 'date', display: 'grid', placeItems: 'center' }}>
                <TypeRing slices={stats.slices} size={RING.size} thickness={RING.thickness}>
                    {mini ? (
                        <Box className={`card-disc card-stock-flat${day.isToday ? ' paper-oxblood' : ''}`}
                             sx={{ width: RING.disc,
                                   height: RING.disc,
                                   display: 'grid',
                                   placeItems: 'center' }}>
                            {number}
                        </Box>
                    ) : (
                        <ButtonBase className={`card-disc card-stock-flat${day.isToday ? ' paper-oxblood' : ''}`}
                                    onClick={() => openDay(day)}
                                    aria-label={`Open ${name}${day.isToday ? ', today' : ''}`}
                                    aria-current={day.isToday ? 'date' : undefined}
                                    sx={{ width: RING.disc,
                                          height: RING.disc,
                                          '&:hover': { filter: 'brightness(0.96)' },
                                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                            {number}
                        </ButtonBase>
                    )}
                </TypeRing>
            </Box>

            {/* Progress: a line per type, levelling out at its share done. */}
            <Box className="card-stock-flat tile"
                 sx={{ gridArea: 'chart', minWidth: 0, px: 0.75, py: 0.4, opacity: empty ? EMPTY : 1 }}>
                <ProgressLines slices={stats.slices} done={stats.done} total={stats.total} />
            </Box>

            <Box className="card-stock-flat tile paper-yellow" sx={{ gridArea: 'menu',
                                                                     display: 'flex',
                                                                     minWidth: 0 }}>
                <DayActions day={day} mini={mini} />
            </Box>

            {/*
                ‹ HEAD › — the view row. Blazor's was two recessed arrows either
                side of a dark red "ALL" in gold; here the arrows are blue card
                and the heading is oxblood card with gold foil. The heading is a
                button too: it goes back to All, which is what "ALL" was for.
            */}
            <Box sx={{ gridArea: 'nav',
                       display: 'flex',
                       gap: '3px',
                       minWidth: 0,
                       opacity: count < 2 ? EMPTY : 1 }}>
                <Box className="card-stock-flat tile paper-blue" sx={{ display: 'flex' }}>
                    <IconButton onClick={() => step(-1)} disabled={count < 2} aria-label="Previous view" sx={ARROW_SX}>
                        <ChevronLeftIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                </Box>

                <ButtonBase className="card-stock-flat tile paper-oxblood"
                            onClick={() => onView(0)}
                            disabled={current === 0}
                            title={view ? `${view.label} — ${current + 1} of ${count}` : 'All'}
                            aria-label={!view || current === 0
                                ? `Showing ${view?.label ?? 'All'}`
                                : `Showing ${view.label}, ${current + 1} of ${count}. Back to All`}
                            sx={{ flex: 1, minWidth: '2.1rem', px: 0.4 }}>
                    <Box component="span"
                         aria-live="polite"
                         className="gold-foil"
                         sx={{ fontFamily: "Georgia, 'Times New Roman', serif",
                               fontWeight: 700,
                               fontSize: '0.62rem',
                               letterSpacing: '0.08em',
                               lineHeight: 1 }}>
                        {view?.short ?? 'ALL'}
                    </Box>
                </ButtonBase>

                <Box className="card-stock-flat tile paper-blue" sx={{ display: 'flex' }}>
                    <IconButton onClick={() => step(1)} disabled={count < 2} aria-label="Next view" sx={ARROW_SX}>
                        <ChevronRightIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    )
}

export default DayHeader

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * The header's three sizes, by the day's own width. Under MIDDLE_FROM the lines
 * take a row of their own, or they would be a sliver; from it they sit beside
 * the date and ⋮ joins the view row; from WIDE_FROM ⋮ stands beside the lines,
 * a slim upright tile, and the view row has the width to itself.
 */
const MIDDLE_FROM = '120px'
const WIDE_FROM = '150px'

/** Ring and disc sizes, in px: the SVG needs numbers, not breakpoint maps. */
const RING = { size: 40, thickness: 4, disc: 28 }

/** Tiles with nothing to show yet stay, faded, so every day has the same face. */
const EMPTY = 0.55

const ARROW_SX = {
    p: 0,
    width: '1.05rem',
    borderRadius: '1px',
    color: 'arc.onPaperStrong',
    '&:hover': { backgroundColor: 'arc.paperHover' },
    '&.Mui-disabled': { color: 'arc.onPaperMuted' },
} as const
