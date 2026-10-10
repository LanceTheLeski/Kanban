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
import { durationLabel } from '../Board/Timeline/Timeline.Nodes'
import { colourOf } from './Calendar.Stats'
import { pointName, stopDone, stopKey, stopTitle, stopTypeId, type PendingPoint, type Stop } from './Calendar.Stops'
import { boardLabel } from './Calendar.Views'
import { useCalendarActions } from './Calendar.Context'

interface DayDueProps
{
    /** This day's points with no time, from every card the calendar can read. */
    stops: Stop[]

    /** Points as they stand in an editor, not saved yet: a preview's. */
    pending?: PendingPoint[]

    /** A preview: nothing opens. */
    readOnly?: boolean
}

export const DayDue: React.FC<DayDueProps> = ({ stops, pending = [], readOnly = false }) =>
{
    const { colours, openCard, boardTitle } = useCalendarActions()
    const manyBoards = new Set(stops.map(stop => stop.card.boardId)).size > 1

    if (stops.length === 0 && pending.length === 0)
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
            { pending.map(point =>
                          (
                              <DueRow key={`pending:${point.key}`}
                                      colour={null}
                                      title={point.title}
                                      caption={[point.name, 'as in the editor, not saved yet', point.duration
                                          ? durationLabel(point.duration)
                                          : null].filter(Boolean)
                                                 .join(' · ')}
                                      label={`${point.title}, ${point.name.toLowerCase()}, no time, as in the editor`} />
                          ))
            }
            { stops.map(stop =>
                        (
                            <DueRow key={stopKey(stop)}
                                    colour={colourOf(stopTypeId(stop), colours)}
                                    title={stopTitle(stop)}
                                    done={stopDone(stop)}
                                    // "Deadline · Write the report · 2 h · Board 1CB0": the point, whose it is, how long, and where.
                                    caption={[pointName(stop),
                                              stop.task
                                                  ? stop.card.title
                                                  : 'card',
                                              stop.duration
                                                  ? durationLabel(stop.duration)
                                                  : null,
                                              manyBoards
                                                  ? boardTitle(stop.card.boardId) || boardLabel(stop.card.boardId)
                                                  : null].filter(Boolean)
                                                         .join(' · ')}
                                    label={`${stopTitle(stop)}, ${pointName(stop).toLowerCase()}, no time${stopDone(stop)
                                        ? ', done'
                                        : ''}`}
                                    card={stop.card.title}
                                    onOpen={readOnly
                                        ? undefined
                                        : () => openCard(stop.card)} />
                        ))
            }
        </Box>
    )
}

export default DayDue

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const DOT = 10

interface DueRowProps
{
    /** The task's type colour; null for a pending point, drawn hollow on blue. */
    colour: string | null

    title: string

    caption: string

    done?: boolean

    label: string

    /** The card it opens, by name. */
    card?: string

    /** Opens the card; absent, the row is not a button. */
    onOpen?: () => void
}

function DueRow({ colour, title, caption, done = false, label, card, onOpen }: DueRowProps)
{
    const face =
    {
        flex: 1,
        minWidth: 0,
        display: 'grid',
        gridTemplateColumns: `${DOT}px minmax(0, 1fr)`,
        columnGap: 1,
        alignItems: 'baseline',
        justifyItems: 'start',
        px: 1,
        py: 0.5,
        textAlign: 'left',
    } as const

    const content = (
        <>
            <Box aria-hidden
                 sx={{ width: DOT,
                       height: DOT,
                       borderRadius: '50%',
                       backgroundColor: colour ?? 'var(--arc-paper)',
                       border: colour
                           ? 'none'
                           : '2px solid var(--arc-blue-deep)',
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
                { title }
            </Typography>
            <Box />
            <Typography component="span"
                        sx={{ fontSize: '0.64rem',
                              color: 'arc.onPaperMuted',
                              overflowWrap: 'anywhere'
                           }}>
                { caption }
            </Typography>
        </>
    )

    return (
        <Box component="li"
             sx={{ display: 'flex' }}>
            { onOpen
                ? (
                      <ButtonBase className="card-stock-flat card-tilt"
                                  onClick={onOpen}
                                  aria-label={`${label}. Open card ${card}`}
                                  sx={{ ...face,
                                        '&:hover': { backgroundColor: 'arc.paperHover' },
                                        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                                     }}>
                          { content }
                      </ButtonBase>
                  )
                : (
                      <Box className={colour === null
                               ? 'card-stock paper-blue'
                               : 'card-stock-flat card-tilt'}
                           role="group"
                           aria-label={label}
                           sx={face}>
                          { content }
                      </Box>
                  )
            }
        </Box>
    )
}
