/**
 * DayOverlay
 *
 * One day, opened up: its graphs at full size with what they count, its cards
 * wrapped round their tasks, and when those tasks are due.
 *
 * Mirrors: Layouts/Calendar/UpdateDateOverlay.razor, which began with the day's
 * own CalendarDate drawn large — its graphs included — and then listed its cards
 * and a timeline of their tasks ordered by end deadline. Those are all here; the
 * graphs gain the legend a 36px ring on the grid has no room for, which is where
 * each type's name and exact count can be read without matching colours. Left
 * behind is everything the overlay showed from no data:
 *
 *   · a date-type selector over a hard-coded list, whose choice was stored in a
 *     field nothing read;
 *   · a palette swatch with a comment saying it should one day open a picker;
 *   · a panel reading "Tag Canvas Placeholder :)";
 *   · a second timeline of six items titled "Event 1" to "Event 6".
 *
 * Tags are the natural home for the first three — a date's CardTagGroupID is
 * already the link between a day and its cards — and that waits on the tag
 * read path. See docs/api-gaps.md.
 *
 * ── What can be changed here ─────────────────────────────────────────────────
 * Which cards are on the day: "+ Add card" puts one on, the × beside a card
 * takes it off. Both show at once and upload behind — see Calendar.Store. The
 * day does not have to be stored first; the server writes its row with its
 * first card.
 *
 * The cards themselves open into their own editor, which is where their tasks
 * and dates are changed.
 */

import React from 'react'
import { Box, ButtonBase, IconButton, Paper, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ArcOverlay } from '../../Components/ArcOverlay'
import { ArcTitleBar } from '../../Components/ArcTitleBar'
import { MONO } from '../../Styles/Fonts'
import { rem } from '../../Styles/Measures'
import { DayCard } from './DayCard'
import { AddCardPicker } from './AddCardPicker'
import { TypeRing } from './TypeRing'
import { ProgressMeter } from './ProgressMeter'
import { dayStats, type DayStats } from './Calendar.Stats'
import { useCalendarActions } from './Calendar.Context'
import { boardLabel } from './Calendar.Views'
import { NUMERALS } from '../../Styles/Fonts'
import dayjs, { type Dayjs } from 'dayjs'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Task } from '../../Entities/Task/Task.Types'
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
}

export const DayOverlay: React.FC<DayOverlayProps> = ({
    day,
    onClose,
    onAddCard,
    onRemoveCard,
    boardIds,
    startAdding = false,
}) => {
    const { colours, openCard, boardTitle } = useCalendarActions()
    const cards = day.stored?.cards ?? []
    const manyBoards = new Set(cards.map(card => card.boardId)).size > 1
    const deadlines = deadlinesOf(cards)
    const stats = dayStats(cards, colours)

    return (
        <ArcOverlay open
                    onClose={onClose}
                    title={day.date.format('dddd D MMMM YYYY')}
                    titleStock={day.isToday ? 'blue' : 'cream'}
                    titleCaption={day.isToday ? 'Today' : undefined}
                    discardLabel="Close"
                    width={DAY_OVERLAY_WIDTH}>
            <Box sx={{ display: 'flex',
                       flexDirection: { xs: 'column', md: 'row' },
                       alignItems: 'stretch',
                       gap: 2 }}>
                {/*
                    The cards: notes on blue, the way the tags panel puts its
                    pieces on blue — a pale coloured ground with something of a
                    different stock set down on it.
                */}
                <Paper className="card-stock paper-blue"
                       elevation={0}
                       sx={{ flex: '1 1 0',
                             minWidth: 0,
                             p: 1.5,
                             display: 'flex',
                             flexDirection: 'column',
                             gap: 1 }}>
                    <ArcTitleBar>Cards</ArcTitleBar>

                    {cards.length === 0 && <Empty>Nothing is on this day yet.</Empty>}

                    {/*
                        The × sits beside the note on the panel, not on the note:
                        the note is itself a button, and a button inside a button
                        is two targets that cannot tell which one was meant.
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

                    <AddCardPicker boardIds={boardIds}
                                   onDay={new Set(cards.map(card => card.id))}
                                   onPick={onAddCard}
                                   startOpen={startAdding} />
                </Paper>

                <Box sx={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ProgressPanel day={day} stats={stats} />

                {/*
                    Deadlines on yellow, the stock the timeline panel cuts its
                    Deadline tab from, strung on the same gold rail its points
                    sit on — so a date here looks like the date it was set as.
                */}
                <Paper className="card-stock paper-yellow"
                       elevation={0}
                       sx={{ minWidth: 0,
                             p: 1.5,
                             display: 'flex',
                             flexDirection: 'column',
                             gap: 1 }}>
                    <ArcTitleBar>Deadlines</ArcTitleBar>

                    {deadlines.length === 0 && (
                        <Empty>{cards.length === 0 ? 'No cards, so no deadlines.' : 'None of these tasks has one.'}</Empty>
                    )}

                    {deadlines.length > 0 && (
                        <Box sx={{ position: 'relative',
                                   display: 'flex',
                                   flexDirection: 'column',
                                   gap: 0.75 }}>
                            {/* The rail, from the first point to the last. */}
                            {deadlines.length > 1 && (
                                <Box aria-hidden
                                     className="card-stock-glued paper-gold"
                                     sx={{ position: 'absolute',
                                           left: RAIL_CENTRE - 2.5,
                                           width: '5px',
                                           top: '1.1rem',
                                           bottom: '1.1rem' }} />
                            )}

                            {deadlines.map(({ task, card, due }) => (
                                <DeadlineRow key={task.id}
                                             task={task}
                                             card={card}
                                             due={due}
                                             day={day.date}
                                             onOpen={() => openCard(card)} />
                            ))}
                        </Box>
                    )}
                </Paper>
                </Box>
            </Box>
        </ArcOverlay>
    )
}

export default DayOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const DAY_OVERLAY_WIDTH = rem(820)

/**
 * The day's two graphs at full size: the type ring round the day's number, the
 * meter, and the legend the grid's ring has no room for — every type by name,
 * with its mark and its count. That list is what makes the colours optional:
 * several of them sit under 3:1 on this card, so they are never the only way to
 * tell one type from another. See Calendar.Stats.
 */
function ProgressPanel({ day, stats }: { day: GridDay; stats: DayStats }) {
    return (
        <Paper className="card-stock"
               elevation={0}
               sx={{ minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ArcTitleBar>Progress</ArcTitleBar>

            {stats.total === 0 && <Empty>No tasks on this day's cards.</Empty>}

            {stats.total > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 0.5 }}>
                    <TypeRing slices={stats.slices} size={64} thickness={7}>
                        <Box className={`card-disc card-stock-flat${day.isToday ? ' paper-ink' : ''}`}
                             sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center' }}>
                            <Typography component="span"
                                        sx={{ fontFamily: NUMERALS, fontWeight: 700, fontSize: '1.15rem', color: 'arc.onPaperStrong' }}>
                                {day.date.date()}
                            </Typography>
                        </Box>
                    </TypeRing>

                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <ProgressMeter done={stats.done} total={stats.total} thickness={8} fontSize="0.72rem" />

                        <Box component="ul" aria-label="Tasks by type" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            {stats.slices.map(slice => (
                                <Box component="li" key={slice.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '2px', flexShrink: 0, backgroundColor: slice.colour }} />
                                    <Typography component="span" sx={{ flex: 1, minWidth: 0, fontSize: '0.74rem', color: 'arc.onPaperStrong' }}>
                                        {slice.title}
                                    </Typography>
                                    <Typography component="span" sx={{ fontFamily: MONO, fontSize: '0.7rem', color: 'arc.onPaper' }}>
                                        {slice.count}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}
        </Paper>
    )
}

interface Deadline {
    task: Task
    card: Card
    due: Dayjs
}

/**
 * Every task on these cards with an end date, soonest first.
 *
 * The end deadline where there is one, which is what the Blazor overlay sorted
 * on. A task in Timeline mode always has one; a task with only a preferred end
 * falls back to that, rather than vanishing from a list of when things are due.
 */
function deadlinesOf(cards: Card[]): Deadline[] {
    return cards
        .flatMap(card => card.tasks.map(task => {
            const at = task.timeline?.endDeadlineUTC ?? task.timeline?.endPreferenceUTC ?? null
            return at ? { task, card, due: dayjs(at) } : null
        }))
        .filter((deadline): deadline is Deadline => deadline !== null)
        .sort((a, b) => a.due.valueOf() - b.due.valueOf())
}

function Empty({ children }: { children: React.ReactNode }) {
    return (
        <Typography sx={{ fontSize: '0.75rem', color: 'arc.onPaperMuted', px: 0.5 }}>
            {children}
        </Typography>
    )
}

/** The rail's centre, in px from the list's left edge — where each point sits. */
const RAIL_CENTRE = 13

const DOT = 14

/**
 * One deadline: a point on the rail, then a strip of card with the time, the
 * task and the card it belongs to. The whole strip opens the card.
 */
function DeadlineRow({ task, card, due, day, onOpen }: { task: Task; card: Card; due: Dayjs; day: Dayjs; onOpen: () => void }) {
    const done = task.isCompleted === true
    // The day is the overlay's heading, so a deadline on it needs only its
    // time; one on another day carries its date under the time, or it would
    // read as today's.
    const otherDay = !due.isSame(day, 'day')

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box aria-hidden
                 className={`card-disc card-stock-glued ${done ? 'paper-ink' : 'paper-grey'}`}
                 sx={{ width: DOT,
                       height: DOT,
                       flexShrink: 0,
                       ml: `${RAIL_CENTRE - DOT / 2}px`,
                       position: 'relative' }} />

            {/*
                Two columns and two lines: the time beside the task, the date
                beside the card it is on. A grid rather than a flex row, so the
                task titles start on one line down the list whatever width the
                time before them is.
            */}
            <ButtonBase className="card-stock-flat card-tilt"
                        onClick={onOpen}
                        aria-label={`${task.title}, due ${due.format('D MMMM HH:mm')}${done ? ', done' : ''}. Open card ${card.title}`}
                        sx={{ flex: 1,
                              minWidth: 0,
                              display: 'grid',
                              gridTemplateColumns: 'minmax(3rem, auto) minmax(0, 1fr)',
                              columnGap: 1,
                              alignItems: 'baseline',
                              justifyItems: 'start',
                              px: 1,
                              py: 0.6,
                              textAlign: 'left',
                              '&:hover': { backgroundColor: 'arc.paperHover' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                <Typography component="span" sx={{ ...WHEN, color: 'arc.onPaper' }}>
                    {due.format('HH:mm')}
                </Typography>

                <Typography component="span"
                            sx={{ fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: done ? 'arc.onPaperMuted' : 'arc.onPaperStrong',
                                  textDecoration: done ? 'line-through' : 'none',
                                  overflowWrap: 'anywhere' }}>
                    {task.title}
                </Typography>

                <Typography component="span" sx={{ ...WHEN, color: 'arc.onPaperMuted' }}>
                    {otherDay ? due.format('DD MMM') : ''}
                </Typography>

                <Typography component="span"
                            sx={{ fontSize: '0.66rem',
                                  color: 'arc.onPaperMuted',
                                  overflowWrap: 'anywhere' }}>
                    {card.title}
                </Typography>
            </ButtonBase>
        </Box>
    )
}

/** The date and time down the left of a deadline: data, so set as data. */
const WHEN = { fontFamily: MONO, fontSize: '0.68rem', lineHeight: 1.6 } as const
