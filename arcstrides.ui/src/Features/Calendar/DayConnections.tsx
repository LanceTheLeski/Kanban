/**
 * DayConnections
 *
 * Where an opened day leads: the days either side of it, the boards its cards
 * are on, the other days its cards are on, and the days its tasks are due.
 *
 *   Nearby     ‹ Mon 29 Sep · Wed 1 Oct ›    step through the days, here
 *   Boards     each card's board              leave for the board itself
 *   Also on    Thu 2 Oct — Migrate auth       the same card, on another day
 *   Due        Fri 3 Oct — Cut over           a task's end, on another day
 *
 * Every day here opens in this overlay, over the calendar — moving the
 * calendar to its month first where it is in another — so a run of days can be
 * worked through without closing anything. Each is text and a date, not only a
 * colour or an arrow, so it reads the same to a screen reader.
 *
 * Mirrors: nothing that was built. UpdateDateOverlay.razor had a second
 * timeline of "Event 1" to "Event 6" beside the real one — a placeholder for
 * things beyond the day's own tasks. These are what the day's data can say
 * about that; "Due" is the deadlines part of it.
 */

import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, ButtonBase, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { Dayjs } from 'dayjs'
import { MONO } from '../../Styles/Fonts'
import { stopsOf } from './Calendar.Stops'
import { boardLabel } from './Calendar.Views'
import { useCalendarActions } from './Calendar.Context'
import { useCalendarStore } from './Calendar.Store'
import type { GridDay } from './Calendar.Grid'

interface DayConnectionsProps {
    day: GridDay
}

export const DayConnections: React.FC<DayConnectionsProps> = ({ day }) => {
    const { goToDay, boardTitle } = useCalendarActions()
    const dates = useCalendarStore(state => state.stored?.dates)
    const cards = day.stored?.cards ?? []

    const boards = [...new Set(cards.map(card => card.boardId).filter(Boolean))]

    // Other days of this month with any of the same cards on them.
    const ids = new Set(cards.map(card => card.id))
    const alsoOn = (dates ?? [])
        .filter(date => date.day !== day.date.date())
        .flatMap(date => {
            const shared = date.cards.filter(card => ids.has(card.id))
            return shared.length > 0 ? [{ at: day.date.date(date.day), what: shared.map(card => card.title).join(', ') }] : []
        })

    // The ends of this day's tasks that fall on other days: its deadlines elsewhere.
    const due = stopsOf(cards)
        .filter(stop => stop.node.id.endsWith('End') && !stop.at.isSame(day.date, 'day'))
        .slice(0, MAX_DUE)

    const previous = day.date.subtract(1, 'day')
    const next = day.date.add(1, 'day')

    return (
        <Box component="nav" aria-label="Connections" sx={{ display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 1.25 }}>
            <Section title="Nearby">
                <Box sx={{ display: 'flex', gap: '3px' }}>
                    <Step to={previous} onGo={goToDay} direction="previous" />
                    <Step to={next} onGo={goToDay} direction="next" />
                </Box>
            </Section>

            {boards.length > 0 && (
                <Section title="Boards">
                    {boards.map(boardId => (
                        <Row key={boardId}
                             component={RouterLink}
                             to={`/board/${boardId}`}
                             label={boardTitle(boardId) || boardLabel(boardId)}
                             aria-label={`Go to board ${boardTitle(boardId) || boardLabel(boardId)}`} />
                    ))}
                </Section>
            )}

            {alsoOn.length > 0 && (
                <Section title="Also on">
                    {alsoOn.map(({ at, what }) => (
                        <Row key={at.format('YYYY-MM-DD')}
                             when={at}
                             label={what}
                             onClick={() => goToDay(at)}
                             aria-label={`Open ${at.format('dddd D MMMM')}, which also has ${what}`} />
                    ))}
                </Section>
            )}

            {due.length > 0 && (
                <Section title="Due">
                    {due.map(stop => (
                        <Row key={`${stop.task.id}:${stop.node.id}`}
                             when={stop.at}
                             label={stop.task.title}
                             caption={stop.node.label.join(' ').toLowerCase()}
                             onClick={() => goToDay(stop.at)}
                             aria-label={`Open ${stop.at.format('dddd D MMMM')}: ${stop.task.title}, ${stop.node.label.join(' ').toLowerCase()}`} />
                    ))}
                </Section>
            )}
        </Box>
    )
}

export default DayConnections

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Past this many, the rest of a day's deadlines are on its timeline. */
const MAX_DUE = 6

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <Typography component="h3"
                        sx={{ fontSize: '0.62rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'arc.onGlass',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                              px: 0.25 }}>
                {title}
            </Typography>
            {children}
        </Box>
    )
}

/** The day before or after, as a blue tile with its arrow on the outside edge. */
function Step({ to, onGo, direction }: { to: Dayjs; onGo: (date: Dayjs) => void; direction: 'previous' | 'next' }) {
    const previous = direction === 'previous'
    return (
        <ButtonBase className="card-stock-flat tile paper-blue"
                    onClick={() => onGo(to)}
                    aria-label={`${previous ? 'Previous' : 'Next'} day, ${to.format('dddd D MMMM')}`}
                    sx={{ flex: 1,
                          minWidth: 0,
                          py: 0.4,
                          gap: 0.25,
                          flexDirection: previous ? 'row' : 'row-reverse',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: 'arc.onPaperStrong',
                          '&:hover': { filter: 'brightness(0.97)' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
            {previous ? <ChevronLeftIcon sx={{ fontSize: '0.9rem' }} /> : <ChevronRightIcon sx={{ fontSize: '0.9rem' }} />}
            {to.format('ddd D MMM')}
        </ButtonBase>
    )
}

type RowProps = {
    label: string
    when?: Dayjs
    caption?: string
    'aria-label': string
} & ({ onClick: () => void; component?: never; to?: never } | { component: typeof RouterLink; to: string; onClick?: never })

/** One connection: a strip of card with its date, if it has one, down the left. */
function Row({ label, when, caption, ...link }: RowProps) {
    return (
        <ButtonBase className="card-stock-flat"
                    {...link}
                    sx={{ display: 'grid',
                          gridTemplateColumns: when ? '2.6rem minmax(0, 1fr)' : 'minmax(0, 1fr)',
                          columnGap: 0.75,
                          alignItems: 'baseline',
                          justifyItems: 'start',
                          px: 0.75,
                          py: 0.45,
                          textAlign: 'left',
                          color: 'arc.onPaperStrong',
                          textDecoration: 'none',
                          '&:hover': { backgroundColor: 'arc.paperHover' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
            {when && (
                <Typography component="span" sx={{ fontFamily: MONO,
                                                   fontSize: '0.62rem',
                                                   color: 'arc.onPaper',
                                                   whiteSpace: 'nowrap' }}>
                    {when.format('D MMM')}
                </Typography>
            )}
            <Typography component="span" sx={{ fontSize: '0.72rem',
                                               fontWeight: 600,
                                               overflowWrap: 'anywhere',
                                               lineHeight: 1.35 }}>
                {label}
                {caption && (
                    <Typography component="span" sx={{ display: 'block',
                                                       fontSize: '0.62rem',
                                                       fontWeight: 400,
                                                       color: 'arc.onPaperMuted' }}>
                        {caption}
                    </Typography>
                )}
            </Typography>
        </ButtonBase>
    )
}
