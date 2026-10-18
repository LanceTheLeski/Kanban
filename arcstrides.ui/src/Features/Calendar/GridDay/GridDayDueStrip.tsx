/**
 * GridDayDueStrip
 *
 * What is due on a day, on the day itself in the month grid: a piece of yellow
 * under its header, a line for each point that falls on it — the time, or a
 * dash for none, and what it is the point of.
 *
 *     ┌──────────────────────────┐
 *     │ 14:00  Cut over          │
 *     │ —      Order supplies    │
 *     │ + 2 more                 │
 *     └──────────────────────────┘
 *
 * Without it a deadline showed only inside the opened day: a card given a day
 * and a time did not appear on that day in the calendar at all, unless it had
 * also been put on the day. A line opens its card; "+ n more" opens the day,
 * where the timeline and Due list them all.
 *
 * Yellow is the stock the Deadline tab is cut from, and Due in the day overlay.
 */

import React from 'react'
import { Box, ButtonBase } from '@mui/material'
import { MONO } from '../../../Styles/Fonts'
import { colourOf } from '../Calendar.Stats'
import { stopDone, stopKey, stopTitle, stopTypeId, type Stop } from '../Calendar.Stops'
import { useCalendarActions } from '../Calendar.Context'
import type { GridDay } from '../Calendar.Grid'

interface GridDayDueStripProps
{
    day: GridDay

    /** The day's points, earliest first. */
    stops: Stop[]

    /** The live copy in the day's own overlay: "+ n more" would open the day it is in. */
    mini?: boolean
}

export const GridDayDueStrip: React.FC<GridDayDueStripProps> = ({ day, stops, mini = false }) =>
{
    const { colours, openCard, openDay } = useCalendarActions()
    const shown = stops.slice(0, SHOWN)
    const more = stops.length - shown.length

    return (
        <Box component="ul"
             aria-label={`Due on ${day.date.format('dddd D MMMM')}`}
             className="card-stock-flat paper-yellow"
             sx={{ m: 0,
                   px: 0.5,
                   py: '3px',
                   listStyle: 'none',
                   display: 'flex',
                   flexDirection: 'column',
                   gap: '1px',
                   minWidth: 0
                }}>
            { shown.map(stop =>
                        (
                            <Box key={stopKey(stop)}
                                 component="li"
                                 sx={{ display: 'flex', minWidth: 0 }}>
                                <ButtonBase onClick={() => openCard(stop.card)}
                                            aria-label={`${stopTitle(stop)}, due ${stop.timed
                                                ? stop.at.format('HH:mm')
                                                : 'with no time'}. Open card ${stop.card.title}`}
                                            sx={{ flex: 1,
                                                  minWidth: 0,
                                                  justifyContent: 'flex-start',
                                                  gap: 0.5,
                                                  px: '2px',
                                                  borderRadius: '1px',
                                                  fontSize: '0.6rem',
                                                  lineHeight: 1.5,
                                                  color: 'arc.onPaperStrong',
                                                  '&:hover': { backgroundColor: 'arc.paperHover' },
                                                  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent' }
                                               }}>
                                    <Box component="span"
                                         aria-hidden
                                         sx={{ width: 6,
                                               height: 6,
                                               flexShrink: 0,
                                               borderRadius: '50%',
                                               backgroundColor: colourOf(stopTypeId(stop), colours)
                                            }} />
                                    <Box component="span"
                                         sx={{ fontFamily: MONO, flexShrink: 0, color: 'arc.onPaper' }}>
                                        { stop.timed
                                            ? stop.at.format('HH:mm')
                                            : '—'
                                        }
                                    </Box>
                                    <Box component="span"
                                         sx={{ minWidth: 0,
                                               overflow: 'hidden',
                                               textOverflow: 'ellipsis',
                                               whiteSpace: 'nowrap',
                                               fontWeight: 600,
                                               textDecoration: stopDone(stop)
                                                   ? 'line-through'
                                                   : 'none'
                                            }}>
                                        { stopTitle(stop) }
                                    </Box>
                                </ButtonBase>
                            </Box>
                        ))
            }
            { more > 0 && (
                <Box component="li"
                     sx={{ display: 'flex' }}>
                    <ButtonBase onClick={() => openDay(day)}
                                disabled={mini}
                                aria-label={`${more} more due on ${day.date.format('dddd D MMMM')}. Open the day`}
                                sx={{ px: '2px',
                                      fontSize: '0.58rem',
                                      color: 'arc.onPaper',
                                      '&:hover': { textDecoration: 'underline' }
                                   }}>
                        + { more } more
                    </ButtonBase>
                </Box>
            )
            }
        </Box>
    )
}

export default GridDayDueStrip

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Lines on the grid's day before "+ n more": the day's notes need the room. */
const SHOWN = 3
