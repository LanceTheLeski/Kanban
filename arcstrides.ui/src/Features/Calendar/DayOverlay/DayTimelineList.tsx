/**
 * DayTimelineList
 *
 * Everything the day's tasks have scheduled, in time order, on one rail — and
 * where this day falls among it.
 *
 * Which stops those are is the overlay's to say: every point of the tasks on
 * the day's cards, and every point with a time that falls on this day from a
 * task anywhere the calendar can read. A point on this day with no time is not
 * here — it has no place on a line of times — but under its card, in the
 * Cards panel below (DayCardsPanel).
 *
 * Mirrors: the MudTimeline in UpdateDateOverlay.razor, which listed each task
 * of the day's cards as "{EndDeadlineUTC}: {Title}", ordered by that deadline.
 * A task's timeline holds up to four points — preferred and required, start
 * and end — and the deadline was only one of them; here each point is its own
 * stop on the rail, so a task that should start today and is due Friday shows
 * as both. It is the same rail the task's own timeline panel draws, in the same
 * gold, standing on its end.
 *
 * Each line leads with its card — a task is never shown without the card it
 * belongs to — and under the card says which task and which point, or that the
 * point is the card's own. Each stop's dot is its task's type colour — the
 * ring's and the lines' — so the colour is a link to the graphs, never the only
 * thing saying which task it is. Stops on this
 * day are at full strength; stops on other days are paler and carry their
 * date. The day itself is not marked on the rail: the panel is already the
 * day's, and a label for it was a second heading in a panel of paper.
 *
 * A preview of the day, opened from a timeline node, draws it read-only, with
 * the point being edited — `pending`, as it stands in the editor — in its place
 * among the rest, on a piece of blue.
 */

import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import type { Dayjs } from 'dayjs'
import { MONO } from '../../../Styles/Fonts'
import { spanLabel } from '../../Board/Timeline/Timeline.Nodes'
import { colourOf } from '../Calendar.Stats'
import { pointName, stopDone, stopKey, stopTitle, stopTypeId, type PendingPoint, type Stop } from '../Calendar.Stops'
import { useCalendarActions } from '../Calendar.Context'
import type { GridDay } from '../Calendar.Grid'

interface DayTimelineListProps
{
    day: GridDay

    /** In time order — see Calendar.Stops. */
    stops: Stop[]

    /** Points as they stand in an editor, not saved yet: a preview's. */
    pending?: PendingPoint[]

    /** A preview: nothing opens. */
    readOnly?: boolean
}

export const DayTimelineList: React.FC<DayTimelineListProps> = ({ day, stops, pending = [], readOnly = false }) =>
{
    const { colours, openCard } = useCalendarActions()
    const rows = [
        ...stops.map(stop => ({ key: stopKey(stop), at: stop.at, stop, point: null })),
        ...pending.map(point => ({ key: `pending:${point.key}`, at: point.at, stop: null, point })),
    ].sort((a, b) => a.at.valueOf() - b.at.valueOf())

    return (
        <Box component="ol"
             aria-label="Timeline of this day's tasks"
             sx={{ position: 'relative',
                   m: 0,
                   p: 0,
                   listStyle: 'none',
                   display: 'flex',
                   flexDirection: 'column',
                   gap: 0.6
                }}>
            {/* The rail: a strip of gold card, first stop to last. */}
            <Box aria-hidden
                 className="card-stock-glued paper-gold"
                 sx={{ position: 'absolute',
                       left: RAIL_CENTRE - 2.5,
                       width: '5px',
                       top: '0.9rem',
                       bottom: '0.9rem'
                    }} />

            { rows.map(row => (row.stop
                ? (
                      <Row key={row.key}
                           at={row.stop.at}
                           timed={row.stop.timed}
                           duration={row.stop.duration}
                           relative={row.stop.relative}
                           onDay={row.stop.at.isSame(day.date, 'day')}
                           colour={colourOf(stopTypeId(row.stop), colours)}
                           title={row.stop.card.title}
                           caption={row.stop.task
                               ? `${row.stop.task.title} · ${pointName(row.stop).toLowerCase()}`
                               : `the card's own ${pointName(row.stop).toLowerCase()}`}
                           done={stopDone(row.stop)}
                           label={`${stopTitle(row.stop)}, ${pointName(row.stop).toLowerCase()} ${row.stop.at.format(row.stop.timed
                               ? 'D MMMM HH:mm'
                               : 'D MMMM, no time')}${stopDone(row.stop)
                                   ? ', done'
                                   : ''}`}
                           card={row.stop.card.title}
                           onOpen={readOnly
                               ? undefined
                               : () => openCard(row.stop!.card)} />
                  )
                : (
                      <Row key={row.key}
                           at={row.point!.at}
                           timed={row.point!.timed}
                           duration={row.point!.duration}
                           relative={row.point!.relative}
                           onDay
                           colour={null}
                           title={row.point!.title}
                           caption={`${row.point!.name} · as in the editor, not saved yet`}
                           label={`${row.point!.title}, ${row.point!.name.toLowerCase()} ${row.point!.at.format(row.point!.timed
                               ? 'HH:mm'
                               : '[no time]')}, as in the editor`}
                           card={null} />
                  )))
            }
        </Box>
    )
}

export default DayTimelineList

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The rail's centre, in px from the list's left edge — where each dot sits. */
const RAIL_CENTRE = 24

const DOT = 12

interface RowProps
{
    at: Dayjs

    timed: boolean

    duration: number | null

    /** Placed in the day's order, not at a chosen time: "≈" before it. */
    relative: boolean

    /** At full strength on the day; paler, and dated, on another. */
    onDay: boolean

    /** The task's type colour; null for a pending point, which is drawn hollow on blue. */
    colour: string | null

    /** The card's title. */
    title: string

    /** Which task and which point — or that the point is the card's own. */
    caption: string

    /** The task is done: its caption is struck through. */
    done?: boolean

    label: string

    /** The card it opens, by name; null for a pending point. */
    card: string | null

    /** Opens the card; absent, the row is not a button. */
    onOpen?: () => void
}

function Row({ at, timed, duration, relative, onDay, colour, title, caption, done = false, label, card, onOpen }: RowProps)
{
    const face =
    {
        flex: 1,
        minWidth: 0,
        display: 'grid',
        gridTemplateColumns: 'minmax(3rem, auto) minmax(0, 1fr)',
        columnGap: 1,
        alignItems: 'baseline',
        justifyItems: 'start',
        px: 1,
        py: 0.5,
        textAlign: 'left',
    } as const

    const content = (
        <>
            <Typography component="span"
                        sx={{ ...WHEN, color: 'arc.onPaper' }}>
                { timed
                    ? spanLabel(at, duration, relative)
                    : '—'
                }
            </Typography>
            <Typography component="span"
                        sx={{ fontSize: '0.76rem',
                              fontWeight: 600,
                              color: 'arc.onPaperStrong',
                              overflowWrap: 'anywhere'
                           }}>
                { title }
            </Typography>
            <Typography component="span"
                        sx={{ ...WHEN, color: 'arc.onPaperMuted' }}>
                { onDay
                    ? ''
                    : at.format('DD MMM')
                }
            </Typography>
            {/* The task, struck through when it is done: the card above it is not. */}
            <Typography component="span"
                        sx={{ fontSize: '0.64rem',
                              color: 'arc.onPaperMuted',
                              textDecoration: done
                                  ? 'line-through'
                                  : 'none',
                              overflowWrap: 'anywhere'
                           }}>
                { caption }
            </Typography>
        </>
    )

    return (
        <Box component="li"
             sx={{ display: 'flex',
                   alignItems: 'center',
                   gap: 1,
                   opacity: onDay
                       ? 1
                       : 0.72
                }}>
            <Box aria-hidden
                 sx={{ width: DOT,
                       height: DOT,
                       ml: `${RAIL_CENTRE - DOT / 2}px`,
                       flexShrink: 0,
                       borderRadius: '50%',
                       backgroundColor: colour ?? 'var(--arc-paper)',
                       border: colour
                           ? 'none'
                           : '2px solid var(--arc-blue-deep)',
                       boxShadow: '0 0 0 2px var(--arc-paper), 0 1px 2px rgba(30, 24, 16, .3)',
                       position: 'relative'
                    }} />

            {/*
                Two columns and two lines: the time beside the task, the date
                beside what the point is and which card. A grid, so the titles
                start on one line down the list whatever width the time is.
            */}
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
                      <Box className={card === null
                               ? 'card-stock paper-blue'
                               : 'card-stock-flat card-tilt'}
                           aria-label={label}
                           role="group"
                           sx={face}>
                          { content }
                      </Box>
                  )
            }
        </Box>
    )
}

/** The date and time down the left of a stop: data, so set as data. */
const WHEN = { fontFamily: MONO, fontSize: '0.66rem', lineHeight: 1.6 } as const
