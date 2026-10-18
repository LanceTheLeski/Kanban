/**
 * GridDayCell
 *
 * One day of the month: a pane of frosted glass with its header of tiles along
 * the top, what is due on the day under it (GridDayDueStrip), and the current
 * view's cards under that, each wrapped round its tasks.
 *
 * Mirrors: Layouts/Calendar/CalendarDate.razor — a `.glass` tile per day, its
 * charts and buttons along the top (see GridDayHeader), and under them a frosted
 * panel holding a carousel of the day's cards with their tasks. The carousel is
 * the view: ‹ › step it, and the heading between them names it.
 *
 * The same component is the live copy in the day's own overlay (`mini`), which
 * is what the Blazor overlay did when it put a CalendarDate inside
 * UpdateDateOverlay: change the day there and the copy shows it as the grid
 * will. It is the grid's day exactly — the same layout, and drawn at the size
 * the grid day is measured at (see useGridDaySize), so what the overlay shows
 * is what the calendar shows. The view it is on is shared through the store,
 * so stepping it in one steps it in the other. In the copy nothing opens the
 * day again.
 *
 * On a phone a day is forty pixels wide: the number and its ring, a note with
 * the card count that opens the day, where there is room for the rest, and a
 * strip of its theme's picture along the foot.
 */

import React, { useMemo } from 'react'
import { Box, ButtonBase, useMediaQuery, useTheme } from '@mui/material'
import { TaskTypeRingChart } from '../Charts/TaskTypeRingChart'
import { GridDayHeader } from './GridDayHeader'
import { DayCardNote } from './DayCardNote'
import { GridDayDueStrip } from './GridDayDueStrip'
import { dayStats } from '../Calendar.Stats'
import { viewsFor } from '../Calendar.Views'
import { useDayTypes } from '../Hooks/useDayTypes'
import { DayTypeSceneArt } from '../Assets/DayTypeSceneArt'
import { DateDiscNumber } from './DateDiscNumber'
import { useCalendarActions } from '../Calendar.Context'
import { useCalendarStore } from '../Calendar.Store'
import { DAY_BODY_MAX_HEIGHT, DAY_MIN_HEIGHT, NOTES_FROM } from '../Calendar.Layout'
import type { GridDay } from '../Calendar.Grid'

interface GridDayCellProps
{
    day: GridDay
    /** The live copy in the day's own overlay. */
    mini?: boolean
}

export const GridDayCell: React.FC<GridDayCellProps> = ({ day, mini = false }) =>
{
    const { colours, boardTitle, openDay, stopsOnDay } = useCalendarActions()
    // What falls due on the day, from every card the calendar can read — see GridDayDueStrip.
    const due = stopsOnDay(day.key)
    const wide = useMediaQuery(useTheme().breakpoints.up(NOTES_FROM))

    const cards = useMemo(() => day.stored?.cards ?? [], [day.stored])
    const stats = useMemo(() => dayStats(cards, colours), [cards, colours])
    const views = useMemo(() => viewsFor(cards, boardTitle), [cards, boardTitle])

    /*
       The view is remembered by key, not by position, so a card added or a task
       ticked — which can add or remove a view before this one — leaves the day
       on the view it was on. A view that disappears puts it back on All.
    */
    const viewKey = useCalendarStore(state => state.dayViews[day.key] ?? 'all')
    const setDayView = useCalendarStore(state => state.setDayView)
    const index = Math.max(views.findIndex(view => view.key === viewKey), 0)
    const view = views[index]

    const name = day.date.format('dddd D MMMM')
    const type = useDayTypes().typeOf(day.date, day.stored?.typeId)

    const number = <DateDiscNumber value={day.date.date()}
                                   disc={PHONE_DISC} />

    return (
        // A group named for its date, so the buttons inside it — "Next view",
        // "Quick actions" — are heard in the context of which day they act on.
        <Box role="group"
             aria-label={mini
                 ? `${name}, as it shows on the calendar`
                 : name}
             className="day-glass"
             // How the overlay finds this day to measure it — see useGridDaySize.
             data-day={mini
                 ? undefined
                 : day.key}
             sx={{ width: '100%',
                   height: mini
                       ? '100%'
                       : undefined,
                   minWidth: 0,
                   minHeight: DAY_MIN_HEIGHT,
                   display: 'flex',
                   flexDirection: 'column',
                   gap: 0.6,
                   p: { xs: 0.3, [NOTES_FROM]: 0.6 },
                   // The header lays itself out by this day's width, not the
                   // window's — see GridDayHeader.
                   containerType: 'inline-size',
                   containerName: 'day',
                   // Above the glass pane behind the month, so its paper is not
                   // frosted by it.
                   position: 'relative'
                }}>
            { wide && (
                <GridDayHeader day={day}
                               stats={stats}
                               views={views}
                               current={index}
                               mini={mini}
                               onView={next => setDayView(day.key, views[next].key)} />
            )
            }

            { wide && due.length > 0 && <GridDayDueStrip day={day}
                                                         stops={due}
                                                         mini={mini} />
            }

            { wide && view && (
                /*
                    The current view's cards, on the day's glass. Scrolls inside
                    a ceiling, so one busy day does not make its whole week tall.
                */
                <Box sx={{ display: 'flex',
                           flexDirection: 'column',
                           gap: 0.5,
                           minWidth: 0,
                           maxHeight: DAY_BODY_MAX_HEIGHT,
                           overflowY: 'auto',
                           // Room for the notes' shadows inside the scroller.
                           pb: 0.5,
                           px: 0.1
                        }}>
                    { view.cards.map(({ card, tasks }) =>
                                     (
                                         <DayCardNote key={card.id}
                                                      card={card}
                                                      tasks={tasks} />
                                     ))
                    }
                </Box>
            )
            }

            {/*
                A phone: the number in its ring, and one small note with the card
                count on it that opens the day.
            */}
            { !wide && (
                <>
                    {/* On a scrap of the same sand sheet the wider days' headers sit on. */}
                    <Box className="card-stock paper-sand"
                         sx={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'center', p: '2px' }}>
                        <TaskTypeRingChart slices={type.ring
                                               ? stats.slices
                                               : []}
                                           size={28}
                                           thickness={3}>
                            { mini
                                ? (
                                      <Box className={`card-disc card-stock-flat card-cut${day.isToday
                                               ? ' paper-oxblood'
                                               : ''}`}
                                           sx={{ width: PHONE_DISC,
                                                 height: PHONE_DISC,
                                                 display: 'grid',
                                                 placeItems: 'center'
                                              }}>
                                          { number }
                                      </Box>
                                  )
                                : (
                                      <ButtonBase className={`card-disc card-stock-flat card-cut${day.isToday
                                                      ? ' paper-oxblood'
                                                      : ''}`}
                                                  onClick={() => openDay(day)}
                                                  aria-label={`Open ${name}${day.isToday
                                                      ? ', today'
                                                      : ''}`}
                                                  aria-current={day.isToday
                                                      ? 'date'
                                                      : undefined}
                                                  sx={{ width: PHONE_DISC, height: PHONE_DISC }}>
                                          { number }
                                      </ButtonBase>
                                  )
                            }
                        </TaskTypeRingChart>
                    </Box>

                    { cards.length > 0 && (
                        <ButtonBase className="note"
                                    onClick={() => openDay(day)}
                                    disabled={mini}
                                    aria-label={`${cards.length} ${cards.length === 1
                                        ? 'card'
                                        : 'cards'} on ${name}`}
                                    sx={{ alignSelf: 'flex-start',
                                          minWidth: '1.2rem',
                                          px: 0.4,
                                          fontSize: '0.62rem',
                                          fontWeight: 700,
                                          lineHeight: 1.6
                                       }}>
                            { cards.length }
                        </ButtonBase>
                    )
                    }

                    {/* What is due on it, as a count on a scrap of the Deadline tab's yellow. */}
                    { due.length > 0 && (
                        <ButtonBase className="card-stock-flat paper-yellow"
                                    onClick={() => openDay(day)}
                                    disabled={mini}
                                    aria-label={`${due.length} due on ${name}`}
                                    sx={{ alignSelf: 'flex-start',
                                          minWidth: '1.2rem',
                                          px: 0.4,
                                          fontSize: '0.62rem',
                                          fontWeight: 700,
                                          lineHeight: 1.6,
                                          color: 'arc.onPaperStrong'
                                       }}>
                            { due.length }
                        </ButtonBase>
                    )
                    }

                    {/* The theme, as a strip of its picture along the foot. */}
                    { type.scene && (
                        <Box className="card-stock-flat tile"
                             title={`${type.name} day`}
                             sx={{ mt: 'auto', height: 12, overflow: 'hidden' }}>
                            <DayTypeSceneArt scene={type.scene}
                                             label={`${type.name} day`} />
                        </Box>
                    )
                    }
                </>
            )
            }
        </Box>
    )
}

export default GridDayCell

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The date's disc on a phone, inside its 28px ring. */
const PHONE_DISC = 22
