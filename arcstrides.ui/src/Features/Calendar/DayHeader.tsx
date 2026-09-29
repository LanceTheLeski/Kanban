/**
 * DayHeader
 *
 * The top of a day, as tiles: the date in its type ring, a tile of progress
 * lines, the quick-actions tile, and the ‹ HEAD › row that changes the view.
 *
 * Mirrors: the top 50px of a Blazor CalendarDate — a donut, a 50px line chart,
 * a column holding the settings and expand icons above ← ALL →. The arrangement
 * is kept; the pieces are cut from card, each tile its own colour, and laid on
 * a sheet of sand card with a hairline of it showing between them — the look of
 * a tablet's start screen, in paper. Each piece casts the short, crisp shadow a
 * cut piece casts on the sheet under it (.card-cut), the way the layers of the
 * day types' pictures do; the sheet itself stands on the day's glass, which
 * still shows between the header and the cards below it.
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
 * The date is not on a tile: it is a disc of card already, ringed with its tasks
 * by type, laid straight on the sheet. The disc fills the ring to its inner
 * edge, so the two read as one piece.
 *
 * ── What the day's type changes ──────────────────────────────────────────────
 * The middle tile is the lines only where there is progress to show and the
 * day's type measures it (see Calendar.DayTypes). Otherwise:
 *
 *   an empty day that expects work    "+ Add card" — over its skyline, if Work
 *   cards, but not one task yet       "+ Add a task"
 *   a Leisure or Vacation day         its picture, with what is on it counted
 *
 * so no day draws a graph of nothing, nor offers it faded: everything on the
 * sheet is opaque paper. A day with no cards has no ‹ HEAD › row either — there
 * is nothing to page through — and ⋮ moves up beside the tile.
 */

import React from 'react'
import { Box, ButtonBase, IconButton } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon from '@mui/icons-material/Add'
import { MONO } from '../../Styles/Fonts'
import { DiscNumber } from './DiscNumber'
import { TypeRing } from './TypeRing'
import { ProgressLines } from './ProgressLines'
import { DayActions } from './DayActions'
import { DayArt } from './DayArt'
import { useCalendarActions, type CalendarActions } from './Calendar.Context'
import { dayTypeOf, type DayType } from './Calendar.DayTypes'
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
    const actions = useCalendarActions()
    const { openDay } = actions
    const name = day.date.format('dddd D MMMM')
    const type = dayTypeOf(day.stored?.typeId)
    const cards = day.stored?.cards ?? []
    const face = faceOf(type, cards.length, stats.total)
    const count = views.length
    const paged = count > 0
    const view = views[current]
    const step = (by: number) => onView((current + by + count) % count)

    const number = <DiscNumber value={day.date.date()} disc={DISC} />

    return (
        /*
            Narrow: date and menu, then the lines, then the view row. Wide:
            date | lines | a slim menu tile, over the view row.

            A container query, not a breakpoint: what decides the layout is how
            wide this day is, and the same day is drawn at two widths — on the
            grid, and as the live copy in its overlay. The day sets itself up as
            the container; see DayCell.
        */
        <Box className="card-stock paper-sand"
             sx={{ display: 'grid',
                   gap: '3px',
                   p: '3px',
                   gridTemplateColumns: 'auto minmax(0, 1fr)',
                   gridTemplateAreas: paged ? '"date menu" "chart chart" "nav nav"' : '"date menu" "chart chart"',
                   gridTemplateRows: paged ? 'auto 1.9rem 1.15rem' : 'auto 1.9rem',
                   alignItems: 'stretch',
                   [`@container day (min-width: ${MIDDLE_FROM})`]: {
                       gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                       gridTemplateAreas: paged ? '"date chart chart" "nav nav menu"' : '"date chart menu"',
                       gridTemplateRows: paged ? '2.6rem 1.15rem' : '2.6rem',
                   },
                   [`@container day (min-width: ${WIDE_FROM})`]: {
                       gridTemplateAreas: paged ? '"date chart menu" "nav nav nav"' : '"date chart menu"',
                   } }}>
            {/*
                The number, punched out of card and glued down, ringed with its
                tasks by type; the number in gold, as Blazor set it. Today is cut
                from oxblood, the one dark stock, which is where gold reads best —
                it was the ground of Blazor's gold ALL. The disc opens the day,
                except in the day's own overlay, where it is only the date.
            */}
            <Box sx={{ gridArea: 'date', display: 'grid', placeItems: 'center' }}>
                <TypeRing slices={type.ring ? stats.slices : []} size={RING.size} thickness={RING.thickness}>
                    {mini ? (
                        <Box className={`card-disc card-stock-flat card-cut${day.isToday ? ' paper-oxblood' : ''}`}
                             sx={{ width: DISC,
                                   height: DISC,
                                   display: 'grid',
                                   placeItems: 'center' }}>
                            {number}
                        </Box>
                    ) : (
                        <ButtonBase className={`card-disc card-stock-flat card-cut${day.isToday ? ' paper-oxblood' : ''}`}
                                    onClick={() => openDay(day)}
                                    aria-label={`Open ${name}${day.isToday ? ', today' : ''}`}
                                    aria-current={day.isToday ? 'date' : undefined}
                                    sx={{ width: DISC,
                                          height: DISC,
                                          '&:hover': { filter: 'brightness(0.96)' },
                                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                            {number}
                        </ButtonBase>
                    )}
                </TypeRing>
            </Box>

            {/* Progress, a line per type, where there is progress to show. */}
            {face === 'lines' && (
                <Box className="card-stock-flat card-cut tile" sx={{ gridArea: 'chart',
                                                            minWidth: 0,
                                                            px: 0.75,
                                                            py: 0.4 }}>
                    <ProgressLines slices={stats.slices} />
                </Box>
            )}

            {face === 'scene' && type.scene && (
                <Box className="card-stock-flat card-cut tile"
                     title={`${type.name} day`}
                     sx={{ gridArea: 'chart', minWidth: 0, position: 'relative', overflow: 'hidden', p: 0 }}>
                    <DayArt scene={type.scene} label={`${type.name} day`} />
                    {cards.length > 0 && (
                        <Box component="span" sx={BADGE_SX}>
                            {/* How much is on, not how far along: neither type measures that. */}
                            {stats.total > 0
                                ? `${stats.total} ${stats.total === 1 ? 'task' : 'tasks'}`
                                : `${cards.length} ${cards.length === 1 ? 'card' : 'cards'}`}
                        </Box>
                    )}
                </Box>
            )}

            {(face === 'add card' || face === 'add task') && (
                <Invite day={day} type={type} face={face} actions={actions} />
            )}

            <Box className="card-stock-flat card-cut tile paper-yellow" sx={{ gridArea: 'menu',
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
            {paged && (
                <Box sx={{ gridArea: 'nav',
                           display: 'flex',
                           gap: '3px',
                           minWidth: 0 }}>
                    <Box className="card-stock-flat card-cut tile paper-blue" sx={{ display: 'flex' }}>
                        <IconButton onClick={() => step(-1)} disabled={count < 2} aria-label="Previous view" sx={ARROW_SX}>
                            <ChevronLeftIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                    </Box>

                    <ButtonBase className="card-stock-flat card-cut tile paper-oxblood"
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

                    <Box className="card-stock-flat card-cut tile paper-blue" sx={{ display: 'flex' }}>
                        <IconButton onClick={() => step(1)} disabled={count < 2} aria-label="Next view" sx={ARROW_SX}>
                            <ChevronRightIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                    </Box>
                </Box>
            )}
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

/**
 * What the middle tile shows — see the header. `faceOf` is the only place the
 * rules are written down.
 */
type Face = 'lines' | 'scene' | 'add card' | 'add task'

function faceOf(type: DayType, cards: number, tasks: number): Face {
    if (type.progress && tasks > 0) return 'lines'
    if (type.scene && !type.invites) return 'scene'
    return cards === 0 ? 'add card' : 'add task'
}

/** Ring sizes, in px: the SVG needs numbers, not breakpoint maps. */
const RING = { size: 40, thickness: 4 }

/** The disc reaches the ring's inner edge, with no glass showing between them. */
const DISC = RING.size - 2 * RING.thickness

/** A count laid on a picture, on a scrap of cream so it reads over any of them. */
const BADGE_SX = {
    position: 'absolute',
    left: 2,
    top: 2,
    px: 0.4,
    borderRadius: '1px',
    backgroundColor: 'rgba(246, 241, 228, 0.88)',
    fontFamily: MONO,
    fontSize: '0.52rem',
    lineHeight: 1.5,
    color: 'arc.onPaperStrong',
} as const

/**
 * "+ Add card" on an empty day that expects work, or "+ Add a task" on one
 * whose cards have none yet — where the lines would otherwise be a graph of
 * nothing. A Work day keeps its skyline, with the offer on a chip in its
 * corner; a day with no theme has only the offer, set quietly, since every
 * empty day in the month carries one and a grid of them should not shout.
 */
function Invite({ day, type, face, actions }: { day: GridDay; type: DayType; face: Face; actions: CalendarActions }) {
    const cards = day.stored?.cards ?? []
    const label = face === 'add card' ? 'Add card' : 'Add a task'

    // A task goes on a card, so with one card there is only one place for it;
    // with several, the day is opened to choose.
    const invite = () => {
        if (face === 'add task' && cards.length === 1) actions.openCard(cards[0])
        else if (face === 'add task') actions.openDay(day)
        else actions.openDay(day, { adding: true })
    }

    return (
        <ButtonBase className="card-stock-flat card-cut tile"
                    onClick={invite}
                    aria-label={`${label} to ${day.date.format('dddd D MMMM')}`}
                    sx={{ gridArea: 'chart',
                          minWidth: 0,
                          position: 'relative',
                          overflow: 'hidden',
                          justifyContent: type.scene ? 'flex-start' : 'center',
                          alignItems: type.scene ? 'flex-start' : 'center',
                          '&:hover .invite-label': { color: 'arc.onPaperStrong' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
            {type.scene && (
                <Box aria-hidden sx={{ position: 'absolute', inset: 0 }}>
                    <DayArt scene={type.scene} />
                </Box>
            )}
            <Box component="span"
                 className="invite-label"
                 sx={type.scene
                     ? { ...BADGE_SX, display: 'inline-flex', alignItems: 'center', fontFamily: 'inherit', fontWeight: 600 }
                     : { display: 'inline-flex',
                         alignItems: 'center',
                         gap: 0.2,
                         fontSize: '0.62rem',
                         fontWeight: 600,
                         lineHeight: 1.6,
                         color: 'arc.onPaperMuted',
                         whiteSpace: 'nowrap' }}>
                <AddIcon sx={{ fontSize: type.scene ? '0.62rem' : '0.75rem' }} />
                {label}
            </Box>
        </ButtonBase>
    )
}

const ARROW_SX = {
    p: 0,
    width: '1.05rem',
    borderRadius: '1px',
    color: 'arc.onPaperStrong',
    '&:hover': { backgroundColor: 'arc.paperHover' },
    '&.Mui-disabled': { color: 'arc.onPaperMuted' },
} as const
