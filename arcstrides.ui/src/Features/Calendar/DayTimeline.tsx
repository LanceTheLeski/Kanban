/**
 * DayTimeline
 *
 * Everything the day's tasks have scheduled, in time order, on one rail — and
 * where this day falls among it.
 *
 * Mirrors: the MudTimeline in UpdateDateOverlay.razor, which listed each task
 * of the day's cards as "{EndDeadlineUTC}: {Title}", ordered by that deadline.
 * A task's timeline holds up to four points — preferred and required, start
 * and end — and the deadline was only one of them; here each point is its own
 * stop on the rail, so a task that should start today and is due Friday shows
 * as both. It is the same rail the task's own timeline panel draws, in the same
 * gold, standing on its end.
 *
 * Each stop's dot is its task's type colour — the ring's and the lines' — and
 * the point's name and the card are written beside it, so the colour is a link
 * to the graphs, never the only thing saying which task it is. The day itself
 * is marked on the rail in gold on oxblood, before its own stops, or where they
 * would be if it has none; stops on other days carry their date.
 */

import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import dayjs, { type Dayjs } from 'dayjs'
import { MONO } from '../../Styles/Fonts'
import { NODES, type NodeSpec } from '../Board/Timeline/Timeline.Nodes'
import { colourOf } from './Calendar.Stats'
import { useCalendarActions } from './Calendar.Context'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Task } from '../../Entities/Task/Task.Types'
import type { GridDay } from './Calendar.Grid'

interface DayTimelineProps {
    day: GridDay
    cards: Card[]
}

export const DayTimeline: React.FC<DayTimelineProps> = ({ day, cards }) => {
    const { colours, openCard } = useCalendarActions()
    const stops = stopsOf(cards)

    if (stops.length === 0) {
        return (
            <Typography sx={{ fontSize: '0.75rem', color: 'arc.onPaperMuted', px: 0.5 }}>
                {cards.length === 0 ? 'No cards, so nothing scheduled.' : 'None of these tasks has a timeline yet.'}
            </Typography>
        )
    }

    // The day's marker goes before the first stop that is not before the day.
    const markerAt = stops.findIndex(stop => !stop.at.isBefore(day.date, 'day'))
    const position = markerAt === -1 ? stops.length : markerAt
    const rows: ({ kind: 'stop'; stop: Stop } | { kind: 'day' })[] = stops.map(stop => ({ kind: 'stop', stop }))
    rows.splice(position, 0, { kind: 'day' })

    return (
        <Box component="ol"
             aria-label="Timeline of this day's tasks"
             sx={{ position: 'relative',
                   m: 0,
                   p: 0,
                   listStyle: 'none',
                   display: 'flex',
                   flexDirection: 'column',
                   gap: 0.6 }}>
            {/* The rail: a strip of gold card, first stop to last. */}
            <Box aria-hidden
                 className="card-stock-glued paper-gold"
                 sx={{ position: 'absolute',
                       left: RAIL_CENTRE - 2.5,
                       width: '5px',
                       top: '0.9rem',
                       bottom: '0.9rem' }} />

            {rows.map(row => row.kind === 'day'
                ? (
                    <Box component="li" key="day" sx={{ display: 'flex',
                                                        alignItems: 'center',
                                                        position: 'relative' }}>
                        <Box className="card-stock-flat tile paper-oxblood"
                             sx={{ ml: `${RAIL_CENTRE - 22}px`, width: 44, py: 0.25, textAlign: 'center' }}>
                            <Box component="span"
                                 className="gold-foil"
                                 sx={{ fontFamily: "Georgia, 'Times New Roman', serif",
                                       fontWeight: 700,
                                       fontSize: '0.62rem',
                                       letterSpacing: '0.06em' }}>
                                {day.date.format('D MMM').toUpperCase()}
                            </Box>
                        </Box>
                        <Typography sx={{ ml: 1, fontSize: '0.66rem', color: 'arc.onPaperMuted' }}>
                            {day.isToday ? 'Today' : 'This day'}
                        </Typography>
                    </Box>
                )
                : (
                    <StopRow key={`${row.stop.task.id}:${row.stop.node.id}`}
                             stop={row.stop}
                             onDay={row.stop.at.isSame(day.date, 'day')}
                             colour={colourOf(row.stop.task.taskType?.id, colours)}
                             onOpen={() => openCard(row.stop.card)} />
                ))}
        </Box>
    )
}

export default DayTimeline

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

interface Stop {
    task: Task
    card: Card
    node: NodeSpec
    at: Dayjs
}

/** Every timeline point of every task on these cards, earliest first. */
function stopsOf(cards: Card[]): Stop[] {
    return cards
        .flatMap(card => card.tasks.flatMap(task => NODES.flatMap(node => {
            const at = task.timeline ? node.seed(task.timeline) : null
            return at ? [{ task, card, node, at: dayjs(at) }] : []
        })))
        .sort((a, b) => a.at.valueOf() - b.at.valueOf())
}

/** The rail's centre, in px from the list's left edge — where each dot sits. */
const RAIL_CENTRE = 24

const DOT = 12

function StopRow({ stop, onDay, colour, onOpen }: { stop: Stop; onDay: boolean; colour: string; onOpen: () => void }) {
    const done = stop.task.isCompleted === true
    const point = stop.node.label.join(' ').toLowerCase()

    return (
        <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: onDay ? 1 : 0.72 }}>
            <Box aria-hidden
                 sx={{ width: DOT,
                       height: DOT,
                       ml: `${RAIL_CENTRE - DOT / 2}px`,
                       flexShrink: 0,
                       borderRadius: '50%',
                       backgroundColor: colour,
                       boxShadow: '0 0 0 2px var(--arc-paper), 0 1px 2px rgba(30, 24, 16, .3)',
                       position: 'relative' }} />

            {/*
                Two columns and two lines: the time beside the task, the date
                beside what the point is and which card. A grid, so the titles
                start on one line down the list whatever width the time is.
            */}
            <ButtonBase className="card-stock-flat card-tilt"
                        onClick={onOpen}
                        aria-label={`${stop.task.title}, ${point} ${stop.at.format('D MMMM HH:mm')}${done ? ', done' : ''}. Open card ${stop.card.title}`}
                        sx={{ flex: 1,
                              minWidth: 0,
                              display: 'grid',
                              gridTemplateColumns: 'minmax(3rem, auto) minmax(0, 1fr)',
                              columnGap: 1,
                              alignItems: 'baseline',
                              justifyItems: 'start',
                              px: 1,
                              py: 0.5,
                              textAlign: 'left',
                              '&:hover': { backgroundColor: 'arc.paperHover' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                <Typography component="span" sx={{ ...WHEN, color: 'arc.onPaper' }}>
                    {stop.at.format('HH:mm')}
                </Typography>
                <Typography component="span"
                            sx={{ fontSize: '0.76rem',
                                  fontWeight: 600,
                                  color: done ? 'arc.onPaperMuted' : 'arc.onPaperStrong',
                                  textDecoration: done ? 'line-through' : 'none',
                                  overflowWrap: 'anywhere' }}>
                    {stop.task.title}
                </Typography>
                <Typography component="span" sx={{ ...WHEN, color: 'arc.onPaperMuted' }}>
                    {onDay ? '' : stop.at.format('DD MMM')}
                </Typography>
                <Typography component="span" sx={{ fontSize: '0.64rem',
                                                   color: 'arc.onPaperMuted',
                                                   overflowWrap: 'anywhere' }}>
                    {stop.node.label.join(' ')} · {stop.card.title}
                </Typography>
            </ButtonBase>
        </Box>
    )
}

/** The date and time down the left of a stop: data, so set as data. */
const WHEN = { fontFamily: MONO, fontSize: '0.66rem', lineHeight: 1.6 } as const
