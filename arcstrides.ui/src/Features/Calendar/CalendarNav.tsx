/**
 * CalendarNav
 *
 * The calendar's bar: the app menu, and which month this is.
 *
 * The Blazor calendar had no bar and no title — the month was whichever one
 * CalendarLayout had been written for, and the page did not say. It is the
 * board's bar, the same blue and the same depth, so moving between the two
 * pages changes what is under the bar rather than the bar itself.
 */

import React from 'react'
import { AppBar, Box, Toolbar, Typography } from '@mui/material'
import { MONO, SCRIPT } from '../../Styles/Fonts'
import type { Dayjs } from 'dayjs'

interface CalendarNavProps {
    /** The first of the month on screen, or null when it could not be told. */
    start: Dayjs | null
    /** The app menu — a slot, for the reason BoardManagementNav gives. */
    menu?: React.ReactNode
}

export const CalendarNav: React.FC<CalendarNavProps> = ({ start, menu }) => (
    // Elevation 24 for the reason BoardManagementNav gives: MudPaper Elevation="25".
    <AppBar position="static" elevation={24} sx={{ backgroundColor: 'primary.main' }}>
        <Toolbar variant="dense" sx={{ gap: 1.5, py: 0.5 }}>
            {menu && <Box sx={{ display: 'flex' }}>{menu}</Box>}

            {/*
                The month in the script the board's title is set in, the year
                beside it in the face the app uses for data. The month is what
                you are looking at; the year is a detail of it.
            */}
            <Typography component="h1" sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Box component="span" sx={{ fontFamily: SCRIPT, fontSize: '1.9rem', lineHeight: 1 }}>
                    {start ? start.format('MMMM') : 'Calendar'}
                </Box>
                {start && (
                    <Box component="span" sx={{ fontFamily: MONO, fontSize: '0.85rem', opacity: 0.85 }}>
                        {start.format('YYYY')}
                    </Box>
                )}
            </Typography>
        </Toolbar>
    </AppBar>
)

export default CalendarNav
