/**
 * DayTimePicker
 *
 * The day a timeline point was just put on, opened up, to say when in it.
 *
 *     ‹ October         Tuesday 14 October
 *     ┌───────────────────────────────────┐
 *     │ 08:00 ┃                           │   the day's hours, on the gold rail
 *     │       ● 09:30 Draft · Write up    │   what already has a time today
 *     │ 10:00 ┃                           │
 *     │       ◉ Deadline 14:00            │   the point being set
 *     └───────────────────────────────────┘
 *     No time today: Review · Write up
 *     [ 14:00 ]   No time   Done
 *
 * The day's timeline is the day overlay's, laid on an hour scale so that a
 * place on it is a time: click a place and the point goes there, to the
 * quarter hour. A time can be typed instead, and a point needs no time at all —
 * "No time" leaves it on the day, where the day overlay lists it under Due.
 *
 * Everything already timed on the day is on the rail, from every card the
 * calendar can read, so a deadline can be put beside — or away from — what is
 * already there. The task's own other points are drawn hollow, as they stand
 * in the editor rather than as last saved.
 *
 * The scale is one control: a slider over the day's minutes. Up and down move
 * the point a quarter hour, Page Up and Page Down an hour, and Delete takes
 * the time off. Midnight is not on it — a point at midnight reads back as one
 * with no time (see isTimed), so the scale runs from 00:15 to 23:45.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import { TimePicker } from '@mui/x-date-pickers'
import type { Dayjs } from 'dayjs'
import { MONO, SERIF } from '../../Styles/Fonts'
import { paperPickerSx } from '../../Styles/Paper'
import { colourOf } from './Calendar.Stats'
import { stopKey, type Stop } from './Calendar.Stops'
import { NO_DAY_TYPE, dayTypeOf } from './Calendar.DayTypes'
import type { CalendarDate } from './Calendar.Types'

/** One of the task's own other points on the day, as it stands in the editor. */
export interface DayMark
{
    label: string

    at: Dayjs

    timed: boolean
}

interface DayTimePickerProps
{
    date: Dayjs

    /** What is stored for the day, for its theme; null for a day with nothing on it. */
    stored: CalendarDate | null

    /** What is being set: "Deadline", "Preferred start". */
    name: string

    /** On `date`, or null for no time. */
    time: Dayjs | null

    /** Everything on the day, from every card the calendar can read, without the task being scheduled. */
    stops: Stop[]

    marks: DayMark[]

    colours: Map<number, string>

    onTime: (time: Dayjs | null) => void

    onBack: () => void

    onDone: () => void
}

export const DayTimePicker: React.FC<DayTimePickerProps> = ({ date, stored, name, time, stops, marks, colours, onTime, onBack, onDone }) =>
{
    const scale = useRef<HTMLDivElement>(null)
    const [hover, setHover] = useState<number | null>(null)
    const type = dayTypeOf(stored?.typeId)
    const timed = stops.filter(stop => stop.timed)
    const untimed = stops.filter(stop => !stop.timed)
    const minutes = time
        ? minutesOf(time)
        : null

    // Opened to show the point and the first thing already on the day, when both
    // fit; else the point; else the first thing; else the working day.
    useEffect(() =>
    {
        const first = timed.length > 0
            ? minutesOf(timed[0].at)
            : null
        const both = [minutes, first].filter((value): value is number => value !== null)
        const earliest = both.length > 0
            ? Math.min(...both)
            : START - 60
        const top = Math.max(...both, earliest) - earliest <= VIEW / HOUR * 60 - 120
            ? earliest - 60
            : (minutes ?? earliest) - 90
        scale.current?.scrollTo({ top: Math.max(0, top / 60 * HOUR) })
        scale.current?.focus({ preventScroll: true })
        // Once, on opening: after that the scale is where its user has put it.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- opening position only
    }, [])

    const labels = placeLabels([
        ...timed.map(stop => ({ key: stopKey(stop), minutes: minutesOf(stop.at) })),
        ...marks.filter(mark => mark.timed).map(mark => ({ key: `mark:${mark.label}`, minutes: minutesOf(mark.at) })),
        ...(minutes === null
            ? []
            : [{ key: 'point', minutes }]),
    ])

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button size="small"
                        startIcon={<ChevronLeftIcon />}
                        onClick={onBack}
                        sx={{ fontSize: '0.66rem', color: 'arc.onPaper', minWidth: 0, flexShrink: 0 }}>
                    { date.format('MMMM') }
                </Button>
                <Box sx={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                    <Typography component="h3"
                                sx={{ m: 0,
                                      fontFamily: SERIF,
                                      fontSize: '1.05rem',
                                      lineHeight: 1.2,
                                      color: 'arc.onPaperStrong'
                                   }}>
                        { date.format('dddd D MMMM') }
                    </Typography>
                    { type.id !== NO_DAY_TYPE.id && (
                        <Typography sx={{ fontSize: '0.62rem', color: 'arc.onPaperMuted' }}>
                            { type.name }
                        </Typography>
                    )
                    }
                </Box>
            </Box>

            {/* The hours: the slider, scrolled to where the day is busy. */}
            <Box ref={scale}
                 role="slider"
                 tabIndex={0}
                 aria-label={`${name} time on ${date.format('dddd D MMMM')}`}
                 aria-orientation="vertical"
                 aria-valuemin={FIRST}
                 aria-valuemax={LAST}
                 aria-valuenow={minutes ?? undefined}
                 aria-valuetext={minutes === null
                     ? 'No time'
                     : clock(minutes)}
                 onKeyDown={key}
                 onClick={event => onTime(at(snap(pointerMinutes(event))))}
                 onMouseMove={event => setHover(snap(pointerMinutes(event)))}
                 onMouseLeave={() => setHover(null)}
                 className="card-stock-flat"
                 sx={{ position: 'relative',
                       height: VIEW,
                       overflowY: 'auto',
                       cursor: 'crosshair',
                       borderRadius: '2px',
                       '&:focus-visible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                    }}>
                <Box sx={{ position: 'relative', height: 24 * HOUR }}>
                    {/* Hour lines, labelled every second hour. */}
                    { Array.from({ length: 24 }, (_, hour) =>
                                                 (
                                                     <Box key={hour}
                                                          aria-hidden
                                                          sx={{ position: 'absolute',
                                                                top: hour * HOUR,
                                                                left: 0,
                                                                right: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.5,
                                                                transform: 'translateY(-50%)',
                                                                pointerEvents: 'none'
                                                             }}>
                                                         <Box component="span"
                                                              sx={{ width: LABELS,
                                                                    flexShrink: 0,
                                                                    pr: 0.5,
                                                                    textAlign: 'right',
                                                                    fontFamily: MONO,
                                                                    fontSize: '0.56rem',
                                                                    color: 'arc.onPaperMuted'
                                                                 }}>
                                                             { hour % 2 === 0
                                                                 ? clock(hour * 60)
                                                                 : ''
                                                             }
                                                         </Box>
                                                         <Box sx={{ flex: 1,
                                                                    borderTop: '1px solid',
                                                                    borderTopColor: 'arc.paperDivider'
                                                                 }} />
                                                     </Box>
                                                 ))
                    }

                    {/* The rail: the day overlay's gold strip, top to bottom of the day. */}
                    <Box aria-hidden
                         className="card-stock-glued paper-gold"
                         sx={{ position: 'absolute',
                               left: RAIL - 2,
                               width: '4px',
                               top: 0,
                               bottom: 0,
                               pointerEvents: 'none'
                            }} />

                    { timed.map(stop =>
                                (
                                    <Marker key={stopKey(stop)}
                                            minutes={minutesOf(stop.at)}
                                            labelTop={labels.get(stopKey(stop)) ?? 0}
                                            colour={colourOf(stop.task.taskType?.id, colours)}
                                            text={`${stop.at.format('HH:mm')} ${stop.task.title}`}
                                            caption={stop.card.title}
                                            done={stop.task.isCompleted === true} />
                                ))
                    }
                    { marks.filter(mark => mark.timed)
                           .map(mark =>
                                (
                                    <Marker key={`mark:${mark.label}`}
                                            minutes={minutesOf(mark.at)}
                                            labelTop={labels.get(`mark:${mark.label}`) ?? 0}
                                            colour={null}
                                            text={`${mark.at.format('HH:mm')} ${mark.label}`}
                                            caption="this task" />
                                ))
                    }

                    {/* Where the pointer would put the point. */}
                    { hover !== null && hover !== minutes && (
                        <Box aria-hidden
                             sx={{ position: 'absolute',
                                   top: hover / 60 * HOUR,
                                   left: LABELS,
                                   right: 0,
                                   borderTop: '1px dashed',
                                   borderTopColor: 'arc.onPaperMuted',
                                   pointerEvents: 'none'
                                }}>
                            <Box component="span"
                                 sx={{ position: 'absolute',
                                       right: 4,
                                       top: -14,
                                       fontFamily: MONO,
                                       fontSize: '0.58rem',
                                       color: 'arc.onPaper'
                                    }}>
                                { clock(hover) }
                            </Box>
                        </Box>
                    )
                    }

                    {/* The point being set. */}
                    { minutes !== null && (
                        <Box aria-hidden
                             sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                            <Box className="card-disc card-stock paper-ink"
                                 sx={{ position: 'absolute',
                                       left: RAIL - 7,
                                       top: minutes / 60 * HOUR - 7,
                                       width: 14,
                                       height: 14,
                                       borderRadius: '50%'
                                    }} />
                            <Box className="card-stock-flat paper-blue"
                                 sx={{ position: 'absolute',
                                       left: TEXT,
                                       top: labels.get('point') ?? 0,
                                       transform: 'translateY(-50%)',
                                       px: 0.75,
                                       py: '1px',
                                       fontSize: '0.66rem',
                                       fontWeight: 700,
                                       whiteSpace: 'nowrap',
                                       color: 'arc.onPaperStrong'
                                    }}>
                                { name } · { clock(minutes) }
                            </Box>
                        </Box>
                    )
                    }
                </Box>
            </Box>

            { (untimed.length > 0 || marks.some(mark => !mark.timed)) && (
                <Box sx={{ fontSize: '0.64rem', color: 'arc.onPaper', lineHeight: 1.5 }}>
                    <Box component="span"
                         sx={{ fontWeight: 700 }}>
                        No time on this day:
                    </Box>
                    { ' ' }
                    { [
                        ...untimed.map(stop => `${stop.task.title} · ${stop.card.title}`),
                        ...marks.filter(mark => !mark.timed).map(mark => `${mark.label} (this task)`),
                    ].join('; ')
                    }
                </Box>
            )
            }

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                <TimePicker value={time}
                            onChange={typed => typedTime(typed)}
                            ampm={false}
                            label="Time"
                            slotProps={{ textField: { size: 'small', sx: { ...paperPickerSx, flex: '1 1 7rem' } },
                                         openPickerButton: { size: 'small' }
                                      }} />
                <Button size="small"
                        aria-pressed={time === null}
                        onClick={() => onTime(null)}
                        className={time === null
                            ? 'card-stock paper-yellow'
                            : 'card-stock-flat'}
                        sx={{ fontSize: '0.66rem', color: 'arc.onPaperStrong', px: 1 }}>
                    No time
                </Button>
                <Button size="small"
                        onClick={onDone}
                        className="card-stock paper-green"
                        sx={{ fontSize: '0.66rem', fontWeight: 700, color: 'arc.onPaperStrong', px: 1.5 }}>
                    Done
                </Button>
            </Box>
        </Box>
    )

    // ── Private ───────────────────────────────────────────────────────────────
    // Closures over the day and the scale above, so they stay with them.

    /** A time of day, in minutes, as an instant on the day — or no time, for midnight. */
    function at(value: number): Dayjs | null
    {
        if (value <= 0)
            return null
        return date.hour(Math.floor(value / 60)).minute(value % 60).second(0).millisecond(0)
    }

    function pointerMinutes(event: React.MouseEvent<HTMLDivElement>): number
    {
        const box = event.currentTarget.getBoundingClientRect()
        const y = event.clientY - box.top + event.currentTarget.scrollTop
        return y / HOUR * 60
    }

    function key(event: React.KeyboardEvent<HTMLDivElement>)
    {
        if (event.key === 'Delete' || event.key === 'Backspace')
        {
            event.preventDefault()
            onTime(null)
            return
        }
        const by = KEY_MINUTES[event.key]
        if (by === undefined)
            return
        event.preventDefault()
        const from = minutes ?? START
        const next = event.key === 'Home' || event.key === 'End'
            ? by
            : clamp(from + by)
        onTime(at(next))
        // Keep the point in sight as it moves.
        const top = next / 60 * HOUR
        const view = event.currentTarget
        if (top < view.scrollTop + HOUR || top > view.scrollTop + VIEW - HOUR)
            view.scrollTo({ top: Math.max(0, top - VIEW / 2) })
    }

    function typedTime(typed: Dayjs | null)
    {
        if (!typed)
        {
            onTime(null)
            return
        }
        if (typed.isValid())
            onTime(at(typed.hour() * 60 + typed.minute()))
    }
}

export default DayTimePicker

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** One hour of the scale, in px. */
const HOUR = 30

/** How much of the day shows at once: nine hours. */
const VIEW = 9 * HOUR

const FIRST = 15

const LAST = 24 * 60 - 15

/** Where the scale starts from when an arrow is pressed with no time set: the working day. */
const START = 9 * 60

/** The hour labels' column, and the rail and the text beside it, in px from the left. */
const LABELS = 40

const RAIL = 50

const TEXT = 62

/** How far apart two labels must be, in px, before the later one is pushed down. */
const LABEL_GAP = 15

const KEY_MINUTES: Record<string, number> =
{
    ArrowUp: -15,
    ArrowLeft: -15,
    ArrowDown: 15,
    ArrowRight: 15,
    PageUp: -60,
    PageDown: 60,
    Home: FIRST,
    End: LAST,
}

function minutesOf(time: Dayjs): number
{
    return time.hour() * 60 + time.minute()
}

/** To the quarter hour, kept off midnight at both ends — midnight is no time. */
function snap(value: number): number
{
    return clamp(Math.round(value / 15) * 15)
}

function clamp(value: number): number
{
    return Math.min(LAST, Math.max(FIRST, value))
}

function clock(value: number): string
{
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

/**
 * Where each label goes, in px down the scale: level with its time, or pushed
 * down just far enough to clear the one above it.
 */
function placeLabels(items: { key: string; minutes: number }[]): Map<string, number>
{
    const placed = new Map<string, number>()
    let floor = -Infinity
    for (const item of [...items].sort((a, b) => a.minutes - b.minutes))
    {
        const top = Math.max(item.minutes / 60 * HOUR, floor + LABEL_GAP)
        placed.set(item.key, top)
        floor = top
    }
    return placed
}

interface MarkerProps
{
    minutes: number

    labelTop: number

    /** The task's type colour; null for one of the task's own points, drawn hollow. */
    colour: string | null

    text: string

    caption: string

    done?: boolean
}

function Marker({ minutes, labelTop, colour, text, caption, done = false }: MarkerProps)
{
    return (
        <Box aria-hidden
             sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <Box sx={{ position: 'absolute',
                       left: RAIL - 5,
                       top: minutes / 60 * HOUR - 5,
                       width: 10,
                       height: 10,
                       borderRadius: '50%',
                       backgroundColor: colour ?? 'var(--arc-paper)',
                       border: colour
                           ? 'none'
                           : '2px solid var(--arc-blue-deep)',
                       boxShadow: '0 0 0 2px var(--arc-paper), 0 1px 2px rgba(30, 24, 16, .3)'
                    }} />
            <Box sx={{ position: 'absolute',
                       left: TEXT,
                       right: 4,
                       top: labelTop,
                       transform: 'translateY(-50%)',
                       fontSize: '0.64rem',
                       lineHeight: 1.2,
                       whiteSpace: 'nowrap',
                       overflow: 'hidden',
                       textOverflow: 'ellipsis',
                       color: 'arc.onPaper',
                       fontStyle: colour
                           ? 'normal'
                           : 'italic',
                       textDecoration: done
                           ? 'line-through'
                           : 'none'
                    }}>
                <Box component="span"
                     sx={{ fontWeight: 600 }}>
                    { text }
                </Box>
                <Box component="span"
                     sx={{ color: 'arc.onPaperMuted' }}>
                    { ` · ${caption}` }
                </Box>
            </Box>
        </Box>
    )
}
