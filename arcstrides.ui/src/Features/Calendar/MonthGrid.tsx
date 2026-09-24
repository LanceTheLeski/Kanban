/**
 * MonthGrid
 *
 * The month: the weekday names across the top, a strip of card for each week,
 * and a strip of frosted glass down each weekday.
 *
 * Mirrors: Layouts/Calendar/CalendarLayout.razor.
 *
 * ── The same grammar as the board ────────────────────────────────────────────
 * On the board, lanes are card and columns are glass, so you can tell which
 * axis a strip runs along by what it is made of. A month has the same two axes
 * — weeks across, weekdays down — and gets the same two materials: a week is a
 * strip of the board's sand card, a weekday is a strip of the board's frosted
 * glass, and a day is where the two cross. A reader who has learned one page
 * has learned the other.
 *
 * ── One set of tracks ────────────────────────────────────────────────────────
 * The names, the strips and the glass are three separate elements that have to
 * line up to the pixel. Rather than each computing a width, all three sit on the
 * same seven-track CSS grid: the names and strips as its items, the glass as an
 * overlay repeating its template. Seven equal fractions of whatever width there
 * is, so the month fills the window at any size — no sideways scroll, which the
 * board needs because its columns are user-defined and the month never does.
 */

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { CONDENSED } from '../../Styles/Fonts'
import { glassStyle } from '../../Styles/Stock'
import { WeekStrip } from './WeekStrip'
import { CALENDAR_GAP, NOTES_FROM } from './Calendar.Layout'
import { WEEKDAYS, type GridDay, type Week } from './Calendar.Grid'
import type { Card } from '../../Entities/Card/Card.Types'

interface MonthGridProps {
    weeks: Week[]
    onOpenDay: (day: GridDay) => void
    onOpenCard: (card: Card) => void
}

export const MonthGrid: React.FC<MonthGridProps> = ({ weeks, onOpenDay, onOpenCard }) => (
    <Box sx={{ ...TRACKS,
               position: 'relative',
               rowGap: 1.25,
               // Room below the last week for the glass to finish on the window,
               // the way it starts on it above the first.
               pb: 1 }}>
        <WeekdayGlass />

        {/*
            The weekday names: the top of each weekday's glass, tinted. Blue for
            the working days, as the Blazor header was (#2494E7, paled to sit on
            glass), and the vermilion of the pagoda in the background for the
            weekend — the week's two kinds of day told apart at the one place
            every column is named.
        */}
        {WEEKDAYS.map((name, index) => (
            <Paper key={name}
                   className="column-cap"
                   elevation={0}
                   style={glassStyle(index === 0 || index === 6 ? WEEKEND_TINT : WEEKDAY_TINT)}
                   sx={{ gridRow: 1,
                         minHeight: '2.25rem',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         position: 'relative',
                         zIndex: 2,
                         px: 0.5 }}>
                <Typography sx={{ fontFamily: CONDENSED,
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.09em',
                                  textTransform: 'uppercase',
                                  color: 'arc.onPaperStrong' }}>
                    {/*
                        The whole name where it fits, three letters where it does
                        not, one on a phone — and only the one on screen is read
                        out, since the others are display: none. Uppercase and
                        letterspaced, like a column name: a heading over a stack
                        of days.
                    */}
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>{name}</Box>
                    <Box component="span" sx={{ display: { xs: 'none', [NOTES_FROM]: 'inline', md: 'none' } }}>
                        {name.slice(0, 3)}
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'inline', [NOTES_FROM]: 'none' } }}>{name[0]}</Box>
                </Typography>
            </Paper>
        ))}

        {weeks.map((week, index) => (
            <WeekStrip key={week.key}
                       week={week}
                       row={index + 2}
                       onOpenDay={onOpenDay}
                       onOpenCard={onOpenCard} />
        ))}
    </Box>
)

export default MonthGrid

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * Seven equal tracks with the calendar's gap between them, and half a gap's
 * sand beyond the outer ones — the grid the names, the strips and the glass
 * all sit on.
 */
const TRACKS = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    columnGap: CALENDAR_GAP,
    px: CALENDAR_GAP,
    pt: 1,
} as const

/**
 * A strip of frosted glass down each weekday, top to bottom — over the sand
 * where it crosses a week, over the window where it crosses a gap. Behind the
 * days and the names, which sit above it at z-index 2.
 */
function WeekdayGlass() {
    return (
        <Box aria-hidden
             sx={{ ...TRACKS,
                   position: 'absolute',
                   inset: 0,
                   zIndex: 1,
                   pointerEvents: 'none' }}>
            {WEEKDAYS.map(name => <Box key={name} className="column-glass" />)}
        </Box>
    )
}

const WEEKDAY_TINT = 'rgb(176, 206, 238)'

const WEEKEND_TINT = 'rgb(238, 178, 160)'
