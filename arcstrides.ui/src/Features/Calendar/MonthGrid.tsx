/**
 * MonthGrid
 *
 * The month: the weekday names across the top, then each day as a pane of glass
 * of its own, seven to a row.
 *
 * Mirrors: Layouts/Calendar/CalendarLayout.razor, which is where this now takes
 * its layout from. Blazor put each CalendarDate on the page as its own `.glass`
 * tile, under a row of blue weekday headers, and nothing behind them. An earlier
 * version here borrowed the board's grammar instead — a sand strip for each week
 * and a frosted strip down each weekday — and a day read as the place two strips
 * crossed rather than as a thing of its own. See "The calendar" in ArcStyles.css.
 *
 * ── The days either side are not drawn ───────────────────────────────────────
 * The slots before the 1st and after the last day are empty: no tile. Blazor
 * filled them with the neighbouring months' days, drawn exactly like this
 * month's, and the 30th of December read as part of January.
 *
 * ── One set of tracks ────────────────────────────────────────────────────────
 * Seven equal fractions of whatever width there is, so the month fills the
 * window at any size and never scrolls sideways.
 */

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { CONDENSED } from '../../Styles/Fonts'
import { DayCell } from './DayCell'
import { CALENDAR_GAP, NOTES_FROM } from './Calendar.Layout'
import { WEEKDAYS, type Week } from './Calendar.Grid'

interface MonthGridProps {
    weeks: Week[]
}

export const MonthGrid: React.FC<MonthGridProps> = ({ weeks }) => (
    <Box sx={{ display: 'grid',
               gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
               columnGap: CALENDAR_GAP,
               rowGap: CALENDAR_GAP,
               alignItems: 'stretch',
               px: CALENDAR_GAP,
               pt: 1,
               pb: 1.5 }}>
        {/*
            The weekday names, on paper: Blazor's were solid #2494E7 headers with
            pale text. Blue card for the working days, the pagoda's red for the
            weekend — the week's two kinds of day told apart at the one place
            every column is named.
        */}
        {WEEKDAYS.map((name, index) => (
            <Paper key={name}
                   className={`card-stock tile ${index === 0 || index === 6 ? 'paper-red' : 'paper-ink'}`}
                   elevation={0}
                   sx={{ gridRow: 1,
                         minHeight: '2rem',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         px: 0.5,
                         mb: 0.25 }}>
                <Typography sx={{ fontFamily: CONDENSED,
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.09em',
                                  textTransform: 'uppercase',
                                  color: 'arc.onPaperStrong' }}>
                    {/*
                        The whole name where it fits, three letters where it does
                        not, one on a phone — and only the one on screen is read
                        out, since the others are display: none.
                    */}
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>{name}</Box>
                    <Box component="span" sx={{ display: { xs: 'none', [NOTES_FROM]: 'inline', md: 'none' } }}>
                        {name.slice(0, 3)}
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'inline', [NOTES_FROM]: 'none' } }}>{name[0]}</Box>
                </Typography>
            </Paper>
        ))}

        {weeks.flatMap((week, row) => week.days.map((day, slot) => day && (
            <Box key={day.key} sx={{ gridRow: row + 2, gridColumn: slot + 1, minWidth: 0, display: 'flex' }}>
                <DayCell day={day} />
            </Box>
        )))}
    </Box>
)

export default MonthGrid
