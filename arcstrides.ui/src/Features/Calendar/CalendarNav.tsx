/**
 * CalendarNav
 *
 * The calendar's bar: the app menu, a way between months, and which month
 * this is.
 *
 * The Blazor calendar had no bar and no title — the month was whichever one
 * CalendarLayout had been written for, and the page did not say, or move. It is
 * the board's bar, the same blue and the same depth, so moving between the two
 * pages changes what is under the bar rather than the bar itself.
 *
 * ── Why the arrows come before the title ─────────────────────────────────────
 * "May" and "September" are different widths. With the arrows after the title
 * they would slide left and right as the month changed, and a reader clicking
 * "next" three times would be chasing the button. Before it, they stay put.
 */

import React from 'react'
import { AppBar, Box, Button, IconButton, LinearProgress, Toolbar, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import dayjs, { type Dayjs } from 'dayjs'
import { MONO, SCRIPT } from '../../Styles/Fonts'

interface CalendarNavProps {
    /** The first of the month on screen. */
    start: Dayjs
    onPrevious: () => void
    onNext: () => void
    onToday: () => void
    /** True while what is stored for the month is still being read. */
    busy?: boolean
    /** The app menu — a slot, for the reason BoardManagementNav gives. */
    menu?: React.ReactNode
}

export const CalendarNav: React.FC<CalendarNavProps> = ({ start, onPrevious, onNext, onToday, busy = false, menu }) => {
    const showingToday = start.isSame(dayjs(), 'month')

    return (
        // Elevation 24 for the reason BoardManagementNav gives: MudPaper Elevation="25".
        <AppBar position="static" elevation={24} sx={{ backgroundColor: 'primary.main',
                                                       position: 'relative' }}>
            <Toolbar variant="dense" sx={{ gap: 1, py: 0.5 }}>
                {menu && <Box sx={{ display: 'flex', mr: 0.5 }}>{menu}</Box>}

                {/*
                    Kept in place and disabled on this month, rather than removed,
                    so the arrows beside it do not jump when it appears.
                */}
                <Button color="inherit"
                        size="small"
                        onClick={onToday}
                        disabled={showingToday}
                        sx={{ '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.45)' } }}>
                    Today
                </Button>

                <IconButton color="inherit" size="small" onClick={onPrevious} aria-label="Previous month">
                    <ChevronLeftIcon />
                </IconButton>
                <IconButton color="inherit" size="small" onClick={onNext} aria-label="Next month">
                    <ChevronRightIcon />
                </IconButton>

                {/*
                    The month in the script the board's title is set in, the year
                    beside it in the face the app uses for data. The month is what
                    you are looking at; the year is a detail of it.
                */}
                <Typography component="h1" sx={{ display: 'flex', alignItems: 'baseline', gap: 1, ml: 0.5 }}>
                    <Box component="span" sx={{ fontFamily: SCRIPT, fontSize: '1.9rem', lineHeight: 1 }}>
                        {start.format('MMMM')}
                    </Box>
                    <Box component="span" sx={{ fontFamily: MONO, fontSize: '0.85rem', opacity: 0.85 }}>
                        {start.format('YYYY')}
                    </Box>
                </Typography>
            </Toolbar>

            {/*
                A hairline along the bottom of the bar while stored cards are on
                their way. The month itself is already drawn; this only says that
                more is coming onto it. Absolute, so it costs no height when gone.
            */}
            {busy && (
                <LinearProgress aria-label="Loading what is stored for this month"
                                sx={{ position: 'absolute',
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      height: 2,
                                      backgroundColor: 'transparent',
                                      '& .MuiLinearProgress-bar': { backgroundColor: 'rgba(255, 255, 255, 0.8)' } }} />
            )}
        </AppBar>
    )
}

export default CalendarNav
