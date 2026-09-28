/**
 * DayOverlay
 *
 * One day, opened up: the day as it shows on the calendar, its cards, its
 * progress at full size, and its timeline.
 *
 * Mirrors: Layouts/Calendar/UpdateDateOverlay.razor —
 *
 *   `<CalendarDate @bind-Date="Date" />` inside the overlay → the live copy,
 *       a DayCell drawn from the same data and the same view as the grid's, so
 *       whatever is changed here shows on it as it will on the calendar
 *   the card titles under it                               → Cards, editable
 *   the timeline of tasks by end deadline                  → Timeline, every point
 *
 * and the graphs gain what a day on the grid has no room for: the lines at a
 * size where they can be compared closely, and a table of every type with its
 * done and total, which is what lets the colours be only a link and never the
 * only way to tell one type from another.
 *
 * Left behind, because they held no data: the date-type selector over a hard-
 * coded list; the palette swatch; "Tag Canvas Placeholder :)"; and a second
 * timeline of "Event 1" to "Event 6". The first two want deciding before they
 * are built — see docs/api-gaps.md, #8.
 */

import React from 'react'
import { Box, IconButton, Paper, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ArcOverlay } from '../../Components/ArcOverlay'
import { ArcTitleBar } from '../../Components/ArcTitleBar'
import { MONO, NUMERALS } from '../../Styles/Fonts'
import { rem } from '../../Styles/Measures'
import { DayCell } from './DayCell'
import { DayCard } from './DayCard'
import { DayTimeline } from './DayTimeline'
import { AddCardPicker } from './AddCardPicker'
import { TypeRing } from './TypeRing'
import { ProgressLines } from './ProgressLines'
import { dayStats, type DayStats } from './Calendar.Stats'
import { boardLabel } from './Calendar.Views'
import { useCalendarActions } from './Calendar.Context'
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
    const { colours, boardTitle } = useCalendarActions()
    const cards = day.stored?.cards ?? []
    const stats = dayStats(cards, colours)
    const manyBoards = new Set(cards.map(card => card.boardId)).size > 1

    return (
        <ArcOverlay open
                    onClose={onClose}
                    title={day.date.format('dddd D MMMM YYYY')}
                    titleStock={day.isToday ? 'red' : 'cream'}
                    titleCaption={day.isToday ? 'Today' : undefined}
                    discardLabel="Close"
                    width={DAY_OVERLAY_WIDTH}>
            <Box sx={{ display: 'grid',
                       gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: `${MINI_WIDTH} minmax(0, 1fr) minmax(0, 1fr)` },
                       alignItems: 'start',
                       gap: 2 }}>
                {/*
                    The day as the calendar shows it — live. Its view is the
                    grid's view, so stepping ‹ › here steps the day on the grid
                    too; nothing in it opens the day again.
                */}
                <Box sx={{ display: 'flex',
                           flexDirection: 'column',
                           gap: 1,
                           width: MINI_WIDTH,
                           maxWidth: '100%',
                           justifySelf: 'center' }}>
                    <ArcTitleBar>On the calendar</ArcTitleBar>
                    <DayCell day={day} mini />
                </Box>

                {/*
                    The cards: notes on blue, the way the tags panel puts its
                    pieces on blue — a pale coloured ground with something of a
                    different stock set down on it.
                */}
                <Paper className="card-stock paper-blue"
                       elevation={0}
                       sx={{ minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <ArcTitleBar>Cards</ArcTitleBar>

                    {cards.length === 0 && <Empty>Nothing is on this day yet.</Empty>}

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

                    <AddCardPicker key={addRequest}
                                   boardIds={boardIds}
                                   onDay={new Set(cards.map(card => card.id))}
                                   onPick={onAddCard}
                                   startOpen={startAdding} />
                </Paper>

                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ProgressPanel day={day} stats={stats} />

                    {/*
                        The timeline on yellow, the stock the task timeline panel
                        cuts its Deadline tab from, on the same gold rail its
                        points sit on.
                    */}
                    <Paper className="card-stock paper-yellow"
                           elevation={0}
                           sx={{ minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <ArcTitleBar>Timeline</ArcTitleBar>
                        <DayTimeline day={day} cards={cards} />
                    </Paper>
                </Box>
            </Box>
        </ArcOverlay>
    )
}

export default DayOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const DAY_OVERLAY_WIDTH = rem(1120)

/** The live copy's width: a day on a desktop grid, so it looks as it will there. */
const MINI_WIDTH = rem(210)

/**
 * The day's graphs at full size: the type ring round the day's number, the
 * progress lines at a height where close values can be told apart, and the
 * table — every type by name, with its mark, its done and its total.
 */
function ProgressPanel({ day, stats }: { day: GridDay; stats: DayStats }) {
    return (
        <Paper className="card-stock"
               elevation={0}
               sx={{ minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ArcTitleBar>Progress</ArcTitleBar>

            {stats.total === 0 && <Empty>No tasks on this day's cards.</Empty>}

            {stats.total > 0 && (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5 }}>
                        <TypeRing slices={stats.slices} size={64} thickness={7}>
                            <Box className={`card-disc card-stock-flat${day.isToday ? ' paper-oxblood' : ''}`}
                                 sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center' }}>
                                <Typography component="span"
                                            className="gold-foil"
                                            sx={{ fontFamily: NUMERALS, fontWeight: 700, fontSize: '1.2rem' }}>
                                    {day.date.date()}
                                </Typography>
                            </Box>
                        </TypeRing>

                        <Box sx={{ flex: 1, minWidth: 0, height: 84, pr: 1 }}>
                            <ProgressLines slices={stats.slices} done={stats.done} total={stats.total} weight="large" />
                        </Box>
                    </Box>

                    <Box component="table"
                         aria-label="Tasks by type"
                         sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { py: 0.25, px: 0.5 } }}>
                        <Box component="thead">
                            <Box component="tr">
                                {['Type', 'Done', 'Of', ''].map(heading => (
                                    <Box component="th"
                                         key={heading}
                                         sx={{ textAlign: heading === 'Type' ? 'left' : 'right',
                                               fontSize: '0.62rem',
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
                                    <Box component="td" sx={{ fontSize: '0.76rem', color: 'arc.onPaperStrong' }}>
                                        <Box component="span"
                                             aria-hidden
                                             sx={{ display: 'inline-block', width: 10, height: 10, mr: 0.75, borderRadius: '2px', verticalAlign: '-1px', backgroundColor: slice.colour }} />
                                        {slice.title}
                                    </Box>
                                    <Box component="td" sx={NUMBER_CELL}>{slice.done}</Box>
                                    <Box component="td" sx={NUMBER_CELL}>{slice.count}</Box>
                                    <Box component="td" sx={{ ...NUMBER_CELL, color: 'arc.onPaperMuted' }}>
                                        {Math.round((slice.done / slice.count) * 100)}%
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </>
            )}
        </Paper>
    )
}

const NUMBER_CELL = {
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: '0.7rem',
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
