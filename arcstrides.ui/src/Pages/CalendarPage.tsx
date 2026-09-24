/**
 * CalendarPage
 *
 * Mirrors: Pages/Calendar.razor, which did nothing but host CalendarLayout.
 *
 * Route: /calendar/:monthId. The month ID replaces the GUID CalendarLayout
 * parsed from a string literal, the way BoardPage's boardId replaced the
 * board's. Like BoardPage, this file reads the route, asks the store to load,
 * chooses between loading, error and the month, and puts the frame round it;
 * the month itself is Features/Calendar.
 */

import React, { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { useShallow } from 'zustand/react/shallow'
import { CalendarNav } from '../Features/Calendar/CalendarNav'
import { MonthView } from '../Features/Calendar/MonthView'
import { useCalendarStore } from '../Features/Calendar/Calendar.Store'
import { monthStart } from '../Features/Calendar/Calendar.Grid'
import { AppMenu } from '../Layouts/AppMenu'

export const CalendarPage: React.FC = () => {
    const { monthId } = useParams<{ monthId: string }>()

    const { status, error, month, loadMonth } = useCalendarStore(
        useShallow(state => ({
            status: state.status,
            error: state.error,
            month: state.month,
            loadMonth: state.loadMonth,
        })),
    )

    useEffect(() => {
        if (monthId) loadMonth(monthId)
    }, [monthId, loadMonth])

    const start = useMemo(() => (month ? monthStart(month) : null), [month])

    if (status === 'loading' || status === 'idle') {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (status === 'error') {
        return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography color="error">Failed to load the month: {error}</Typography>
                <Button variant="outlined" onClick={() => monthId && loadMonth(monthId)}>
                    Retry
                </Button>
            </Box>
        )
    }

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: 'transparent' }}>
            {/* The same window the board is framed in. */}
            <Paper className="glass" elevation={0} sx={{ width: '92%', mx: 'auto' }}>
                <CalendarNav start={start} menu={<AppMenu />} />

                {month && start
                    ? <MonthView month={month} start={start} />
                    : <NoDays />}
            </Paper>
        </Box>
    )
}

export default CalendarPage

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * A month the API has no days for. Said on a piece of card, not guessed at:
 * with no stored date there is nothing to say which month it is, and a grid
 * for this month instead would look like the right answer.
 */
function NoDays() {
    return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <Paper className="card-stock" elevation={0} sx={{ px: 2, py: 1.5, maxWidth: '30rem' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'arc.onPaperStrong' }}>
                    No days are stored for this month yet.
                </Typography>
            </Paper>
        </Box>
    )
}
