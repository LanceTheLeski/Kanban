/**
 * DayDue
 *
 * What falls on a day with no time of day: every point of a task — from any
 * card the calendar can read, not only the cards put on the day — that was
 * given this day and no time.
 *
 * The left half of the day overlay's cards section, beside the cards put on
 * the day. A point with a time is on the timeline above it; one with only a
 * date has no place on a line of times, so it is listed here, the way an
 * all-day event sits above a diary's hours.
 *
 * Each row is its task, the point, and the card, and opens the card. The dot
 * is the task's type colour, as on the timeline and the ring, and never the
 * only thing naming the task.
 *
 * Mirrors: nothing in Blazor. It takes over from the Due list that was in
 * DayConnections, which listed the day's own tasks' ends on other days; those
 * are on the timeline, paler and dated, so nothing it said is lost.
 */

import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { colourOf } from './Calendar.Stats'
import { pointName, stopKey, type Stop } from './Calendar.Stops'
import { boardLabel } from './Calendar.Views'
import { useCalendarActions } from './Calendar.Context'

interface DayDueProps
{
    /** This day's points with no time, from every card the calendar can read. */
    stops: Stop[]
}

export const DayDue: React.FC<DayDueProps> = ({ stops }) =>
{
    const { colours, openCard, boardTitle } = useCalendarActions()
    const manyBoards = new Set(stops.map(stop => stop.card.boardId)).size > 1

    if (stops.length === 0)
    {
        return (
            <Typography sx={{ fontSize: '0.75rem', color: 'arc.onPaperMuted', px: 0.5 }}>
                Nothing is due on this day without a time.
            </Typography>
        )
    }

    return (
        <Box component="ul"
             aria-label="Due on this day, with no time"
             sx={{ m: 0,
                   p: 0,
                   listStyle: 'none',
                   display: 'flex',
                   flexDirection: 'column',
                   gap: 0.75
                }}>
            { stops.map(stop =>
                        (
                            <DueRow key={stopKey(stop)}
                                    stop={stop}
                                    colour={colourOf(stop.task.taskType?.id, colours)}
                                    board={manyBoards
                                        ? boardTitle(stop.card.boardId) || boardLabel(stop.card.boardId)
                                        : null}
                                    onOpen={() => openCard(stop.card)} />
                        ))
            }
        </Box>
    )
}

export default DayDue

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const DOT = 10

function DueRow({ stop, colour, board, onOpen }: { stop: Stop; colour: string; board: string | null; onOpen: () => void })
{
    const done = stop.task.isCompleted === true
    const point = pointName(stop).toLowerCase()

    return (
        <Box component="li"
             sx={{ display: 'flex' }}>
            <ButtonBase className="card-stock-flat card-tilt"
                        onClick={onOpen}
                        aria-label={`${stop.task.title}, ${point}, no time${done
                            ? ', done'
                            : ''}. Open card ${stop.card.title}`}
                        sx={{ flex: 1,
                              minWidth: 0,
                              display: 'grid',
                              gridTemplateColumns: `${DOT}px minmax(0, 1fr)`,
                              columnGap: 1,
                              alignItems: 'baseline',
                              justifyItems: 'start',
                              px: 1,
                              py: 0.5,
                              textAlign: 'left',
                              '&:hover': { backgroundColor: 'arc.paperHover' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                           }}>
                <Box aria-hidden
                     sx={{ width: DOT,
                           height: DOT,
                           borderRadius: '50%',
                           backgroundColor: colour,
                           boxShadow: '0 0 0 2px var(--arc-paper), 0 1px 2px rgba(30, 24, 16, .3)',
                           alignSelf: 'center'
                        }} />
                <Typography component="span"
                            sx={{ fontSize: '0.76rem',
                                  fontWeight: 600,
                                  color: done
                                      ? 'arc.onPaperMuted'
                                      : 'arc.onPaperStrong',
                                  textDecoration: done
                                      ? 'line-through'
                                      : 'none',
                                  overflowWrap: 'anywhere'
                               }}>
                    { stop.task.title }
                </Typography>
                <Box />
                <Typography component="span"
                            sx={{ fontSize: '0.64rem',
                                  color: 'arc.onPaperMuted',
                                  overflowWrap: 'anywhere'
                               }}>
                    { pointName(stop) } · { stop.card.title }{ board
                        ? ` · ${board}`
                        : ''
                                                             }
                </Typography>
            </ButtonBase>
        </Box>
    )
}
