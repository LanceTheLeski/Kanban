/**
 * DayOverlay
 *
 * One day, opened up.
 *
 *   ┌─────────────────────────────────────────────────┬──────────────┐
 *   │ (30) [ picture ]  Tuesday 30 September   [tags] │  the day, as │
 *   ├─────────────────────────────────────────────────┤  on the grid │
 *   │ Timeline — the bulk of it                       │  Progress    │
 *   │ Cards, and + Add card                           │  Connections │
 *   └─────────────────────────────────────────────────┴──────────────┘
 *
 * Mirrors: Layouts/Calendar/UpdateDateOverlay.razor, which was laid out the
 * same way round — flex-row-reverse, the CalendarDate and its card titles in a
 * column on the right, and on the left a header row (the date, the type, the
 * swatch, the tags) over the timeline. Here:
 *
 *   the header row                   → DayBand: the number, the theme's
 *                                      picture (click it to change the theme),
 *                                      the date in words, the tags
 *   the timeline by end deadline     → the timeline, every point, as the bulk
 *   the card titles                  → Cards, editable, under it
 *   `<CalendarDate>` in the column   → the live copy, top right, on glass, at
 *                                      exactly the size the grid draws it
 *   the second, placeholder timeline → Connections: nearby days, boards,
 *                                      other days, deadlines elsewhere
 *
 * The right-hand column is slim and frosted, the grid's own material, because
 * what is in it is the day as the calendar sees it and the ways out of it.
 *
 * ── What the day's type changes ──────────────────────────────────────────────
 * A day that measures progress (see Calendar.DayTypes) gets the table of types
 * with done and total; Leisure gets what is on, by type, without the done; a
 * vacation gets neither, and if anything is on it, says so beside the offer to
 * move it. Empty panels are not drawn: a day with no timeline has no Timeline
 * panel, rather than one saying there is nothing in it.
 */

import React from 'react'
import { Box, Button, IconButton, Paper, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ArcOverlay } from '../../Components/ArcOverlay'
import { ArcTitleBar } from '../../Components/ArcTitleBar'
import { MONO } from '../../Styles/Fonts'
import { rem } from '../../Styles/Measures'
import { DayBand } from './DayBand'
import { DayCell } from './DayCell'
import { DayCard } from './DayCard'
import { DayTimeline } from './DayTimeline'
import { DayConnections } from './DayConnections'
import { AddCardPicker } from './AddCardPicker'
import { dayStats, type DayStats } from './Calendar.Stats'
import { dayTypeOf } from './Calendar.DayTypes'
import { stopsOf } from './Calendar.Stops'
import { unfinished } from './Calendar.Moves'
import { boardLabel } from './Calendar.Views'
import { useCalendarActions } from './Calendar.Context'
import { useGridDaySize } from './useGridDaySize'
import type { Card } from '../../Entities/Card/Card.Types'
import type { GridDay } from './Calendar.Grid'

interface DayOverlayProps {
    day: GridDay
    onClose: () => void
    onAddCard: (card: Card) => void
    onRemoveCard: (card: Card) => void
    /** Boards whose cards "+ Add card" offers — see useCardChoices. */
    boardIds: string[]
    /** Opened from "Add a card…": the search is already open. */
    startAdding?: boolean
    /**
     * Bumped each time "Add a card…" is chosen, including from the live copy's
     * own ⋮ while the overlay is already open, so the search opens again.
     */
    addRequest?: number
}

export const DayOverlay: React.FC<DayOverlayProps> = ({
    day,
    onClose,
    onAddCard,
    onRemoveCard,
    boardIds,
    startAdding = false,
    addRequest = 0,
}) => {
    const actions = useCalendarActions()
    const { colours, boardTitle } = actions
    const cards = day.stored?.cards ?? []
    const stats = dayStats(cards, colours)
    const type = dayTypeOf(day.stored?.typeId)
    const gridDay = useGridDaySize(day.key)
    const manyBoards = new Set(cards.map(card => card.boardId)).size > 1
    const timed = stopsOf(cards).length > 0
    const carry = unfinished(cards)

    return (
        <ArcOverlay open onClose={onClose} discardLabel="Close" width={DAY_OVERLAY_WIDTH}>
            <Box sx={{ display: 'grid',
                       gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) auto' },
                       gridTemplateAreas: { xs: '"band" "main" "side"', md: '"band side" "main side"' },
                       gridTemplateRows: { md: 'auto 1fr' },
                       alignItems: 'start',
                       columnGap: 2,
                       rowGap: 2 }}>
                <Box sx={{ gridArea: 'band', minWidth: 0 }}>
                    <DayBand day={day} />
                </Box>

                <Box sx={{ gridArea: 'main', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/*
                        The timeline on yellow, the stock the task timeline panel
                        cuts its Deadline tab from, on the same gold rail its
                        points sit on.
                    */}
                    {timed && (
                        <Paper className="card-stock paper-yellow"
                               elevation={0}
                               sx={{ minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/*
                                Sage — the green ladder's mid, which nothing else
                                in the day view is cut from: a label of its own
                                colour for the panel that is the bulk of the day,
                                cool against the yellow it sits on and the gold
                                of the rail under it.
                            */}
                            <ArcTitleBar stock="sage">Timeline</ArcTitleBar>
                            <DayTimeline day={day} cards={cards} />
                        </Paper>
                    )}

                    {/*
                        The cards: notes on blue, the way the tags panel puts its
                        pieces on blue — a pale coloured ground with something of a
                        different stock set down on it.
                    */}
                    <Paper className="card-stock paper-blue"
                           elevation={0}
                           sx={{ minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <ArcTitleBar>Cards</ArcTitleBar>

                        {cards.length === 0 && <Empty>{type.emptyNote}</Empty>}
                        {cards.length > 0 && type.busyNote && <Empty>{type.busyNote}</Empty>}
                        {cards.length > 0 && !timed && <Empty>None of these tasks has a timeline yet.</Empty>}

                        {/*
                            The × sits beside the card on the panel, not on it: the
                            card's title is itself a button, and a button inside a
                            button is two targets that cannot tell which was meant.
                        */}
                        {cards.map(card => (
                            <Box key={card.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                <DayCard card={card}
                                         tasks={card.tasks}
                                         size="medium"
                                         boardCaption={manyBoards
                                             ? boardTitle(card.boardId) || boardLabel(card.boardId)
                                             : undefined} />
                                <IconButton size="small"
                                            onClick={() => onRemoveCard(card)}
                                            aria-label={`Take ${card.title} off this day`}
                                            sx={{ flexShrink: 0,
                                                  color: 'arc.onPaperMuted',
                                                  '&:hover': { color: 'arc.paperDanger', backgroundColor: 'arc.paperHover' } }}>
                                    <CloseIcon sx={{ fontSize: '0.95rem' }} />
                                </IconButton>
                            </Box>
                        ))}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: '1 1 14rem', minWidth: 0 }}>
                                <AddCardPicker key={addRequest}
                                               boardIds={boardIds}
                                               onDay={new Set(cards.map(card => card.id))}
                                               onPick={onAddCard}
                                               startOpen={startAdding} />
                            </Box>

                            {/* The evening chore: what is left, onto the next working day. */}
                            {carry.length > 0 && (
                                <Button size="small"
                                        onClick={() => actions.carryOver(day)}
                                        sx={{ color: 'arc.onPaperStrong',
                                              textTransform: 'none',
                                              fontSize: '0.74rem' }}>
                                    Carry {carry.length} unfinished to {actions.carryTarget(day).format('ddd D MMM')}
                                </Button>
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/*
                    The slim column, on glass: the day as the calendar shows it
                    — live, so stepping ‹ › here steps it on the grid too — its
                    numbers, and where it leads.
                */}
                <Box className="day-glass"
                     sx={{ gridArea: 'side',
                           // As slim as the column can be, and never narrower
                           // than the grid's day plus the padding round it.
                           width: { md: gridDay ? `max(${SIDE_WIDTH}, ${gridDay.width + SIDE_PADDING * 2}px)` : SIDE_WIDTH },
                           minWidth: 0,
                           p: 1,
                           display: 'flex',
                           flexDirection: 'column',
                           gap: 1.5,
                           alignSelf: 'stretch' }}>
                    {/*
                        The day exactly as the calendar draws it: the grid day's
                        own width and height, so its layout is the grid's too.
                    */}
                    <Box sx={{ width: gridDay?.width ?? '100%',
                               height: gridDay?.height,
                               maxWidth: '100%',
                               flexShrink: 0,
                               alignSelf: 'center',
                               display: 'flex' }}>
                        <DayCell day={day} mini />
                    </Box>
                    {(type.progress || type.ring) && stats.total > 0 && <TypesTable stats={stats} progress={type.progress} />}
                    <DayConnections day={day} />
                </Box>
            </Box>
        </ArcOverlay>
    )
}

export default DayOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const DAY_OVERLAY_WIDTH = rem(1120)

/** The slim column: a day on a desktop grid, and a little, so it looks as it will there. */
const SIDE_WIDTH = rem(236)

/** The side column's padding, in px — p: 1. */
const SIDE_PADDING = 8

/**
 * Every type on the day by name, with its mark and its count — and, on a day
 * that measures progress, its done and its share. What lets the ring's and the
 * lines' colours be only a link, never the only way to tell types apart.
 */
function TypesTable({ stats, progress }: { stats: DayStats; progress: boolean }) {
    const headings = progress ? ['Type', 'Done', 'Of', ''] : ['Type', 'Tasks']

    return (
        <Paper className="card-stock"
               elevation={0}
               sx={{ minWidth: 0, p: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <ArcTitleBar>{progress ? `Progress · ${stats.done} of ${stats.total}` : 'What is on'}</ArcTitleBar>

            <Box component="table"
                 aria-label="Tasks by type"
                 sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { py: 0.2, px: 0.4 } }}>
                <Box component="thead">
                    <Box component="tr">
                        {headings.map(heading => (
                            <Box component="th"
                                 key={heading}
                                 sx={{ textAlign: heading === 'Type' ? 'left' : 'right',
                                       fontSize: '0.58rem',
                                       fontWeight: 700,
                                       letterSpacing: '0.06em',
                                       textTransform: 'uppercase',
                                       color: 'arc.onPaperMuted' }}>
                                {heading}
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Box component="tbody">
                    {stats.slices.map(slice => (
                        <Box component="tr" key={slice.key}>
                            <Box component="td" sx={{ fontSize: '0.72rem', color: 'arc.onPaperStrong' }}>
                                <Box component="span"
                                     aria-hidden
                                     sx={{ display: 'inline-block',
                                           width: 9,
                                           height: 9,
                                           mr: 0.6,
                                           borderRadius: '2px',
                                           verticalAlign: '-1px',
                                           backgroundColor: slice.colour }} />
                                {slice.title}
                            </Box>
                            {progress && <Box component="td" sx={NUMBER_CELL}>{slice.done}</Box>}
                            <Box component="td" sx={NUMBER_CELL}>{slice.count}</Box>
                            {progress && (
                                <Box component="td" sx={{ ...NUMBER_CELL, color: 'arc.onPaperMuted' }}>
                                    {Math.round((slice.done / slice.count) * 100)}%
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Paper>
    )
}

const NUMBER_CELL = {
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: '0.66rem',
    fontVariantNumeric: 'tabular-nums',
    color: 'arc.onPaper',
} as const

function Empty({ children }: { children: React.ReactNode }) {
    return (
        <Typography sx={{ fontSize: '0.75rem', color: 'arc.onPaperMuted', px: 0.5 }}>
            {children}
        </Typography>
    )
}
