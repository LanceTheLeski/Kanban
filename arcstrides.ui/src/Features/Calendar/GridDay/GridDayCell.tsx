/**
 * GridDayCell
 *
 * One day of the month: a pane of frosted glass with its header of tiles along
 * the top, and the current view's cards under it, each wrapped round its tasks.
 *
 * The cards are every card on the day: the ones put on it, and the ones due on
 * it — by dates of their own, or by a task's (Calendar.Stops, cardsOnDay). A
 * task is never listed on its own; it is under its card, with its time. The
 * day is a fixed height, and its cards scroll inside it.
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
 * the card count that opens the day — yellow when any of them is due — and a
 * strip of its theme's picture along the foot.
 */

import React, { useMemo } from 'react'
import { Box, ButtonBase, useMediaQuery, useTheme } from '@mui/material'
import { TaskTypeRingChart } from '../Charts/TaskTypeRingChart'
import { GridDayHeader } from './GridDayHeader'
import { DayCardNote } from './DayCardNote'
import { dayStats } from '../Calendar.Stats'
import { viewsFor } from '../Calendar.Views'
import { cardsOnDay } from '../Calendar.Stops'
import { useDayTypes } from '../Hooks/useDayTypes'
import { DayTypeSceneArt } from '../Assets/DayTypeSceneArt'
import { DateDiscNumber } from './DateDiscNumber'
import { useCalendarActions } from '../Calendar.Context'
import { useCalendarStore } from '../Calendar.Store'
import { DAY_HEIGHT, NOTES_FROM } from '../Calendar.Layout'
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
    // What falls on the day, from every card the calendar can read.
    const due = stopsOnDay(day.key)
    const wide = useMediaQuery(useTheme().breakpoints.up(NOTES_FROM))

    // The cards put on the day, and the ones due on it, each once.
    const entries = useMemo(() => cardsOnDay(day.stored?.cards ?? [], due), [day.stored, due])
    const stats = useMemo(() => dayStats(entries.map(entry => ({ ...entry.card, tasks: entry.tasks })), colours), [entries, colours])
    const views = useMemo(() => viewsFor(entries, boardTitle), [entries, boardTitle])
    const dueCards = entries.filter(entry => entry.own.length > 0 || entry.taskPoints.length > 0).length

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
                   // Fixed, not a floor: the day does not grow with what is on
                   // it; its body scrolls instead. See DAY_HEIGHT.
                   height: mini
                       ? '100%'
                       : DAY_HEIGHT,
                   minWidth: 0,
                   overflow: 'hidden',
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

            {/*
                The day's body: the current view's cards. It takes whatever
                height the header leaves and scrolls within it, so the day keeps
                its size however much is on it.
            */}
            { wide && view && (
                <Box aria-label={`What is on ${name}`}
                     role="region"
                     sx={{ flex: 1,
                           minHeight: 0,
                           overflowY: 'auto',
                           display: 'flex',
                           flexDirection: 'column',
                           gap: 0.5,
                           minWidth: 0,
                           // Room for the notes' shadows inside the scroller.
                           pb: 0.5,
                           px: 0.1
                        }}>
                    { view.cards.map(({ entry, card, tasks }) =>
                                     (
                                         <DayCardNote key={card.id}
                                                      card={card}
                                                      tasks={tasks}
                                                      entry={entry} />
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

                    {/* The counts side by side, so they fit the day's fixed height. */}
                    <Box sx={{ display: 'flex',
                               flexWrap: 'wrap',
                               gap: 0.4,
                               minHeight: 0,
                               overflow: 'hidden'
                            }}>
                    { entries.length > 0 && (
                        <ButtonBase className={dueCards > 0
                                        ? 'card-stock-flat paper-yellow'
                                        : 'note'}
                                    onClick={() => openDay(day)}
                                    disabled={mini}
                                    aria-label={`${entries.length} ${entries.length === 1
                                        ? 'card'
                                        : 'cards'} on ${name}${dueCards > 0
                                            ? `, ${dueCards} due`
                                            : ''}`}
                                    sx={{ alignSelf: 'flex-start',
                                          minWidth: '1.2rem',
                                          px: 0.4,
                                          fontSize: '0.62rem',
                                          fontWeight: 700,
                                          lineHeight: 1.6,
                                          color: 'arc.onPaperStrong'
                                       }}>
                            { entries.length }
                        </ButtonBase>
                    )
                    }
                    </Box>

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
