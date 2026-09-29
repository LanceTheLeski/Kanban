/**
 * CalendarNav
 *
 * The calendar's bar: the app menu, a way between months, and which month
 * this is.
 *
 * The Blazor calendar had no bar and no title — the month was whichever one
 * CalendarLayout had been written for, and the page did not say, or move. It is
 * the board's bar, the same navy with its controls laid on it as pieces of
 * card, so moving between the two pages changes what is under the bar rather
 * than the bar itself.
 *
 * There is no "Today": it only ever did one thing, go back to this month, and
 * sat disabled on this month, which is where the calendar almost always is. The
 * Calendar entry in the Honu menu goes to this month too.
 *
 * ── Why the arrows come before the title ─────────────────────────────────────
 * "May" and "September" are different widths. With the arrows after the title
 * they would slide left and right as the month changed, and a reader clicking
 * "next" three times would be chasing the button. Before it, they stay put.
 */

import React from 'react'
import { AppBar, Box, IconButton, LinearProgress, Toolbar, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { Dayjs } from 'dayjs'
import { MONO, SCRIPT } from '../../Styles/Fonts'

interface CalendarNavProps {
    /** The first of the month on screen. */
    start: Dayjs
    onPrevious: () => void
    onNext: () => void
    /** True while what is stored for the month is still being read. */
    busy?: boolean
    /** The app menu — a slot, for the reason BoardManagementNav gives. */
    menu?: React.ReactNode
}

export const CalendarNav: React.FC<CalendarNavProps> = ({ start, onPrevious, onNext, busy = false, menu }) => {
    return (
        // Flat navy, as the board's bar is — see .app-bar.
        <AppBar position="static" elevation={0} className="app-bar" sx={{ position: 'relative' }}>
            {/*
                Wraps, as the board's bar does: on a phone two arrows and
                "September" in script can be wider than the bar, and a toolbar
                that does not wrap pushes the whole page sideways instead.
            */}
            <Toolbar variant="dense" sx={{ gap: { xs: 0.5, sm: 1 }, py: 0.5, flexWrap: 'wrap', rowGap: 0 }}>
                {menu && <Box sx={{ display: 'flex', mr: 0.5 }}>{menu}</Box>}

                {/* The arrows, as two small pieces of card laid on the bar. */}
                <IconButton className="card-stock-flat card-cut bar-piece" onClick={onPrevious} aria-label="Previous month" sx={ARROW_SX}>
                    <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <IconButton className="card-stock-flat card-cut bar-piece" onClick={onNext} aria-label="Next month" sx={ARROW_SX}>
                    <ChevronRightIcon fontSize="small" />
                </IconButton>

                {/*
                    The month in the script the board's title is set in, the year
                    beside it in the face the app uses for data. The month is what
                    you are looking at; the year is a detail of it.
                */}
                <Typography component="h1" sx={{ display: 'flex', alignItems: 'baseline', gap: 1, ml: 0.5 }}>
                    {/* In gold foil, on navy: the deep gold reads best on. */}
                    <Box component="span"
                         className="gold-foil"
                         sx={{ fontFamily: SCRIPT,
                               fontSize: { xs: '1.5rem', sm: '1.9rem' },
                               lineHeight: 1.15,
                               // Room for the script's swashes inside the clipped gradient.
                               px: 0.25 }}>
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
                                      '& .MuiLinearProgress-bar': { backgroundColor: 'var(--arc-gold)' } }} />
            )}
        </AppBar>
    )
}

export default CalendarNav

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** An arrow on the bar: a small square of card. */
const ARROW_SX = {
    width: 30,
    height: 28,
    color: 'arc.onPaperStrong',
    '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'common.white', outlineOffset: 2 },
} as const
