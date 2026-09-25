/**
 * CalendarPage
 *
 * Mirrors: Pages/Calendar.razor, which did nothing but host CalendarLayout.
 *
 * Route: /calendar/:year/:month, month 1–12 as people write it. /calendar
 * goes to whichever month it is today — see CurrentMonth.
 *
 * ── Drawn first, filled in after ─────────────────────────────────────────────
 * The Blazor page parsed a month ID from a string literal and drew January 2025
 * whatever that ID held. Here the month comes from the route, and the grid is
 * drawn from it straight away — every day of it, with no request in the way.
 * What is stored for the month is read alongside and laid over the days when it
 * arrives. A month nobody has put anything on is not an empty state; it is the
 * month, with nothing on it yet.
 *
 * A failed read therefore does not cost the grid. It costs the cards, and says
 * so above the grid with a way to try again.
 */

import React, { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Paper, Typography } from '@mui/material'
import { useShallow } from 'zustand/react/shallow'
import dayjs, { type Dayjs } from 'dayjs'
import { CalendarNav } from '../Features/Calendar/CalendarNav'
import { MonthView } from '../Features/Calendar/MonthView'
import { useCalendarStore } from '../Features/Calendar/Calendar.Store'
import { AppMenu } from '../Layouts/AppMenu'

export const CalendarPage: React.FC = () => {
    const params = useParams<{ year: string; month: string }>()
    const navigate = useNavigate()

    const year = Number(params.year)
    const month = Number(params.month) - 1
    const valid = Number.isInteger(year) && year >= 1 && year <= 9999
                  && Number.isInteger(month) && month >= 0 && month <= 11

    const { status, error, loadMonth } = useCalendarStore(
        useShallow(state => ({
            status: state.status,
            error: state.error,
            loadMonth: state.loadMonth,
        })),
    )

    useEffect(() => {
        if (valid) loadMonth(year, month)
    }, [valid, year, month, loadMonth])

    // A month the calendar does not have — /calendar/2026/13 — goes to this one
    // rather than to an error page about a typo in the address bar.
    if (!valid) return <CurrentMonth />

    const start = dayjs(new Date(year, month, 1))
    const go = (to: Dayjs) => navigate(monthPath(to))

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: 'transparent' }}>
            {/* The same window the board is framed in. */}
            <Paper className="glass" elevation={0} sx={{ width: '92%', mx: 'auto' }}>
                <CalendarNav start={start}
                             busy={status === 'loading'}
                             onPrevious={() => go(start.subtract(1, 'month'))}
                             onNext={() => go(start.add(1, 'month'))}
                             onToday={() => go(dayjs())}
                             menu={<AppMenu />} />

                {status === 'error' && <ReadFailed error={error} onRetry={() => loadMonth(year, month)} />}

                <MonthView year={year} month={month} />
            </Paper>
        </Box>
    )
}

/** /calendar, and anywhere the route names no real month: today's month. */
export const CurrentMonth: React.FC = () => <Navigate to={monthPath(dayjs())} replace />

export default CalendarPage

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function monthPath(date: Dayjs): string {
    return `/calendar/${date.year()}/${date.month() + 1}`
}

/**
 * The read failed: said on red card above the grid, which is still drawn. The
 * detail is kept to a line; the whole of it is in the network tab.
 */
function ReadFailed({ error, onRetry }: { error: string | null; onRetry: () => void }) {
    return (
        <Box sx={{ px: 1, pt: 1, display: 'flex', justifyContent: 'center' }}>
            <Paper className="card-stock paper-red"
                   elevation={0}
                   role="alert"
                   sx={{ px: 1.5,
                         py: 0.75,
                         display: 'flex',
                         alignItems: 'center',
                         gap: 1.5,
                         maxWidth: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem',
                                  color: 'arc.onPaperStrong',
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap' }}
                            title={error ?? undefined}>
                    Could not load what is on this month's days.{error ? ` ${error}` : ''}
                </Typography>
                <Button size="small"
                        variant="text"
                        className="card-stock"
                        onClick={onRetry}
                        sx={{ flexShrink: 0, px: 1, textTransform: 'none', fontSize: '0.72rem', color: 'arc.onPaperStrong' }}>
                    Try again
                </Button>
            </Paper>
        </Box>
    )
}
