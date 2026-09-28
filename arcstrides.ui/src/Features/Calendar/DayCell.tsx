/**
 * DayCell
 *
 * One day of the month: its number and graphs along the top, its views under
 * them, and the cards of the current view, each wrapped round its tasks.
 *
 * Mirrors: Layouts/Calendar/CalendarDate.razor, top to bottom —
 *
 *   the day's number in the donut   → the number on its disc, inside TypeRing
 *   the completion line chart       → ProgressMeter
 *   the settings (⋮) and expand     → DayActions; the number itself opens the day
 *   ‹  ALL  ›                       → ViewSwitcher
 *   the carousel of cards and tasks → the current view's DayCards
 *
 * The Blazor date was a fixed 170px square that scrolled inside. A day here is
 * as wide as its seventh of the month — about that, on a desktop — and its
 * cards scroll inside a ceiling, so one busy day does not make its whole week
 * tall.
 *
 * On a phone a day is forty pixels wide: the number and its ring, and a note
 * with the card count that opens the day, where there is room for the rest.
 */

import React, { useMemo, useState } from 'react'
import { Box, ButtonBase, Typography, useMediaQuery, useTheme } from '@mui/material'
import { NUMERALS } from '../../Styles/Fonts'
import { TypeRing } from './TypeRing'
import { ProgressMeter } from './ProgressMeter'
import { DayActions } from './DayActions'
import { ViewSwitcher } from './ViewSwitcher'
import { DayCard } from './DayCard'
import { dayStats } from './Calendar.Stats'
import { viewsFor } from './Calendar.Views'
import { useCalendarActions } from './Calendar.Context'
import { DAY_BODY_MAX_HEIGHT, DAY_MIN_HEIGHT, NOTES_FROM } from './Calendar.Layout'
import type { GridDay } from './Calendar.Grid'

interface DayCellProps {
    day: GridDay
}

export const DayCell: React.FC<DayCellProps> = ({ day }) => {
    const { colours, boardTitle, openDay } = useCalendarActions()
    const wide = useMediaQuery(useTheme().breakpoints.up(NOTES_FROM))

    const cards = useMemo(() => day.stored?.cards ?? [], [day.stored])
    const stats = useMemo(() => dayStats(cards, colours), [cards, colours])
    const views = useMemo(() => viewsFor(cards, boardTitle), [cards, boardTitle])

    /*
       The view is remembered by key, not by position, so a card added or a task
       ticked — which can add or remove a view before this one — leaves the day
       on the view it was on. A view that disappears puts it back on All.
    */
    const [viewKey, setViewKey] = useState('all')
    const index = Math.max(views.findIndex(view => view.key === viewKey), 0)
    const view = views[index]

    const name = day.date.format('dddd D MMMM')
    const ring = wide ? RING_WIDE : RING_NARROW

    return (
        // A group named for its date, so the buttons inside it — "Next view",
        // "Quick actions" — are heard in the context of which day they act on.
        <Box role="group"
             aria-label={name}
             sx={{ minWidth: 0,
                   minHeight: DAY_MIN_HEIGHT,
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'stretch',
                   gap: 0.5,
                   p: { xs: 0.3, [NOTES_FROM]: 0.6 },
                   // Above the weekday glass, so the notes are not frosted —
                   // the same stacking as a board cell.
                   position: 'relative',
                   zIndex: 2 }}>
            {/*
                The header: the number in its ring, the meter, the menu. Wraps,
                so on a narrow day the meter takes a line of its own rather than
                being squeezed to a sliver beside the number.
            */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, minWidth: 0 }}>
                <TypeRing slices={stats.slices} size={ring.size} thickness={ring.thickness}>
                    {/*
                        The number, punched out of card and glued down — a disc,
                        like the days in the date pickers and the points on a
                        task's timeline. Today is cut from the pickers' ink. It is
                        the button that opens the day, and only the disc is.
                    */}
                    <ButtonBase className={`card-disc card-stock-flat${day.isToday ? ' paper-ink' : ''}`}
                                onClick={() => openDay(day)}
                                aria-label={`Open ${name}${day.isToday ? ', today' : ''}`}
                                aria-current={day.isToday ? 'date' : undefined}
                                sx={{ width: ring.disc,
                                      height: ring.disc,
                                      '&:hover': { filter: 'brightness(0.96)' },
                                      '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                        <Typography component="span"
                                    sx={{ fontFamily: NUMERALS,
                                          fontWeight: 700,
                                          fontSize: wide ? '0.88rem' : '0.7rem',
                                          lineHeight: 1,
                                          color: 'arc.onPaperStrong' }}>
                            {day.date.date()}
                        </Typography>
                    </ButtonBase>
                </TypeRing>

                {wide && stats.total > 0 && (
                    <Box sx={{ flex: '1 1 2.75rem', minWidth: '2.75rem', order: { xs: 3, md: 0 } }}>
                        <ProgressMeter done={stats.done} total={stats.total} />
                    </Box>
                )}

                {wide && (
                    <Box sx={{ ml: 'auto', display: 'flex' }}>
                        <DayActions day={day} />
                    </Box>
                )}
            </Box>

            {wide && view && (
                <>
                    <ViewSwitcher views={views} current={index} onChange={next => setViewKey(views[next].key)} />

                    {/* The current view's cards. Scrolls inside its ceiling. */}
                    <Box sx={{ display: 'flex',
                               flexDirection: 'column',
                               gap: 0.5,
                               minWidth: 0,
                               maxHeight: DAY_BODY_MAX_HEIGHT,
                               overflowY: 'auto',
                               // Room for the notes' shadows inside the scroller.
                               pb: 0.5,
                               px: 0.1 }}>
                        {view.cards.map(({ card, tasks }) => (
                            <DayCard key={card.id} card={card} tasks={tasks} />
                        ))}
                    </Box>
                </>
            )}

            {/*
                Too narrow for any of that: one small note with the card count on
                it, so a phone still shows which days have something on them. It
                opens the day, where the cards have room to be read.
            */}
            {!wide && cards.length > 0 && (
                <ButtonBase className="note"
                            onClick={() => openDay(day)}
                            aria-label={`${cards.length} ${cards.length === 1 ? 'card' : 'cards'} on ${name}`}
                            sx={{ alignSelf: 'flex-start',
                                  minWidth: '1.2rem',
                                  px: 0.4,
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  lineHeight: 1.6 }}>
                    {cards.length}
                </ButtonBase>
            )}
        </Box>
    )
}

export default DayCell

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Ring and disc sizes, in px: the SVG needs numbers, not breakpoint maps. */
const RING_WIDE = { size: 36, thickness: 4, disc: 24 }
const RING_NARROW = { size: 28, thickness: 3, disc: 18 }
