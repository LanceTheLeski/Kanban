/**
 * DatePickerTimeStep
 *
 * The day a timeline point was just put on, opened up, to say when in it — and
 * for how long.
 *
 *     ‹ October         Tuesday 14 October
 *     [ Relative ] [ Exact time ]
 *     ┌───────────────────────────────────┐
 *     │ 08:00 ┃                           │   the day's hours, on the gold rail
 *     │       ● 09:30–11:00 Draft · …     │   what already has a time today
 *     │ 10:00 ┃                           │
 *     │       █ Deadline · 14:00–16:00    │   the point being set, as long as it lasts
 *     └───────────────────────────────────┘
 *     No time on this day: Review · Write up
 *     [🕑 14:00 ]  No time
 *     Lasts  —  15 min  30 min  1 h  2 h  3 h  4 h  Custom…
 *     See the whole day                  Done
 *
 * The day's timeline is the day overlay's, laid on an hour scale so that a
 * place on it is a time: click a place and the point goes there, to the
 * quarter hour; drag down from it and the point lasts as long as the drag.
 * A time can be typed instead, and a point needs no time at all — "No time"
 * leaves it on the day, where the day overlay lists it under its card.
 *
 * Everything already timed on the day is on the rail, from every card the
 * calendar can read, each as long as it lasts, so a deadline can be put beside
 * — or away from — what is already there. The task's own other points are
 * drawn hollow, as they stand in the editor rather than as last saved. "See the
 * whole day" opens the day as the calendar's day view draws it, with this point
 * in it.
 *
 * The scale is one control: a slider over the day's minutes. Up and down move
 * the point a quarter hour, Page Up and Page Down an hour, Shift with up or
 * down makes it last a quarter hour less or more, and Delete takes the time
 * off. Midnight is not on it — a point at midnight reads back as one with no
 * time (see isTimed), so the scale runs from 00:15 to 23:45.
 *
 * ── Two modes ────────────────────────────────────────────────────────────────
 * Exact time is the hours above. Relative puts the point among the day's timed
 * things instead, with no clock in sight: the scale gives way to the things in
 * order on the same rail, with a place between each two (DatePickerOrderList),
 * and the point goes where it is put. It is given the time the thing before it
 * ends — that is what Calendar.RelativePlacement works out — and saved as
 * placed, not chosen, so it shows as "≈" wherever a time is shown. One too long
 * for its place goes there anyway, red, saying why. On a day with nothing timed
 * there is one place, and a point put there is at noon.
 *
 * Relative is the mode the step opens in: where a point goes among the day's
 * things is what most points are about, and an hour is a commitment few of
 * them have. Only a point already at a time chosen on the hours opens in Exact.
 *
 * Switching to Relative puts a point that has a time in the place its time is
 * in — at noon, on a day with nothing timed — and so does moving a placed point
 * here from another day. Switching to Exact keeps the time it was given, as a
 * time now chosen.
 *
 * "Custom…", beside the lengths in either mode, opens CustomDurationPopover for
 * any length from a minute to a week.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, ButtonBase, InputBase, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ScheduleIcon from '@mui/icons-material/Schedule'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import type { Dayjs } from 'dayjs'
import { MONO, SERIF } from '../../../Styles/Fonts'
import { durationLabel, spanLabel } from '../../Board/Timeline/Timeline.Nodes'
import { colourOf } from '../Calendar.Stats'
import { stopDone, stopKey, stopTypeId, type Stop } from '../Calendar.Stops'
import { FIRST_MINUTE, LAST_MINUTE, fitsAt, gapAt, gapOf, inOrder, type PlacedItem } from '../Calendar.RelativePlacement'
import { DatePickerOrderList, type OrderItem } from './DatePickerOrderList'
import { CustomDurationPopover } from './CustomDurationPopover'
import { NO_DAY_TYPE } from '../Calendar.DayTypes'
import { useDayTypes } from '../Hooks/useDayTypes'
import type { CalendarDate } from '../Calendar.Types'

/** One of the task's own other points on the day, as it stands in the editor. */
export interface DayMark
{
    label: string

    at: Dayjs

    timed: boolean

    duration: number | null

    /** Placed in the day's order, not at a chosen time — see the header. */
    relative: boolean
}

/** A change to the point: its time, how long it lasts, or both — a drag sets both. */
export interface PointChange
{
    time?: Dayjs | null

    duration?: number | null

    /** Whether the time was placed in the day's order rather than chosen. */
    relative?: boolean
}

interface DatePickerTimeStepProps
{
    date: Dayjs

    /** What is stored for the day, for its theme; null for a day with nothing on it. */
    stored: CalendarDate | null

    /** What is being set: "Deadline", "Preferred start". */
    name: string

    /** On `date`, or null for no time. */
    time: Dayjs | null

    /** Minutes from `time`, or null for an instant. */
    duration: number | null

    /** The time was placed in the day's order: the step opens in Relative. */
    relative: boolean

    /**
     * The point was just moved to this day from another. A placed point is
     * placed again among this day's things — its place on the other day means
     * nothing here.
     */
    moved?: boolean

    /** Everything on the day, from every card the calendar can read, without the one being scheduled. */
    stops: Stop[]

    marks: DayMark[]

    colours: Map<number, string>

    onChange: (change: PointChange) => void

    onBack: () => void

    onDone: () => void

    /** Opens the whole day, as the calendar's day view draws it, with this point in it. */
    onOpenDay?: () => void
}

export const DatePickerTimeStep: React.FC<DatePickerTimeStepProps> = ({
    date,
    stored,
    name,
    time,
    duration,
    relative,
    moved = false,
    stops,
    marks,
    colours,
    onChange,
    onBack,
    onDone,
    onOpenDay,
}) =>
{
    const scale = useRef<HTMLDivElement>(null)
    const [hover, setHover] = useState<number | null>(null)
    const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
    const [mode, setMode] = useState<'exact' | 'relative'>(time && !relative
        ? 'exact'
        : 'relative')
    const custom = useRef<HTMLSpanElement>(null)
    const [customOpen, setCustomOpen] = useState(false)
    const type = useDayTypes().typeOf(date, stored?.typeId)
    const timed = stops.filter(stop => stop.timed)
    const untimed = stops.filter(stop => !stop.timed)
    const minutes = time
        ? minutesOf(time)
        : null

    // What Relative puts the point among: everything timed on the day, in order.
    const items = inOrder<OrderItem>([
        ...timed.map(stop => placed(minutesOf(stop.at), stop.duration, {
            key: stopKey(stop),
            title: stop.card.title,
            name: stop.task?.title ?? stop.card.title,
            caption: stop.task
                ? stop.task.title
                : "the card's own",
            colour: colourOf(stopTypeId(stop), colours),
            length: stop.duration,
            done: stopDone(stop),
        })),
        ...marks.filter(mark => mark.timed)
                .map(mark => placed(minutesOf(mark.at), mark.duration, {
                    key: `mark:${mark.label}`,
                    title: mark.label,
                    name: `its ${mark.label.toLowerCase()}`,
                    caption: 'this one',
                    colour: null,
                    length: mark.duration,
                    done: false,
                })),
    ])

    // The gap a point was put in here, by its time then: two things at one
    // moment are a tie its time alone cannot break (see gapOf), so a point put
    // between them is shown where it was put, for as long as it is still there.
    const [placedGap, setPlacedGap] = useState<{ index: number; minutes: number } | null>(null)
    const gap = minutes === null
        ? null
        : placedGap?.minutes === minutes
            ? placedGap.index
            : gapOf(items, minutes)

    // A placed point just moved here is placed again, as Relative would on
    // switching to it: the time it kept from the other day was only where it sat
    // among that day's things.
    useEffect(() =>
    {
        if (moved && relative && minutes !== null)
            place(gapOf(items, minutes), duration)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- on arriving only
    }, [])

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
        // On opening, and when Exact brings the scale back: after that the scale
        // is where its user has put it.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- opening position only
    }, [mode])

    const labels = placeLabels([
        ...timed.map(stop => ({ key: stopKey(stop), minutes: minutesOf(stop.at) })),
        ...marks.filter(mark => mark.timed).map(mark => ({ key: `mark:${mark.label}`, minutes: minutesOf(mark.at) })),
        ...(minutes === null
            ? []
            : [{ key: 'point', minutes }]),
    ])

    // While dragging, the point is drawn where the drag says, not where it was.
    const shownFrom = drag
        ? Math.min(drag.from, drag.to)
        : minutes
    const shownLength = drag
        ? Math.abs(drag.to - drag.from)
        : duration ?? 0

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

            {/* Relative, among the day's things; or Exact time, on the hours. */}
            <Box role="group"
                 aria-label={`How the ${name.toLowerCase()} is placed in the day`}
                 sx={{ display: 'flex', gap: 0.5 }}>
                <Piece chosen={mode === 'relative'}
                       onClick={() => changeMode('relative')}>
                    Relative
                </Piece>
                <Piece chosen={mode === 'exact'}
                       onClick={() => changeMode('exact')}>
                    Exact time
                </Piece>
            </Box>

            { mode === 'relative' && (
                <DatePickerOrderList items={items}
                                     name={name}
                                     at={gap}
                                     fits={minutes === null || fitsAt(items, minutes, duration)}
                                     duration={duration}
                                     onPlace={index => place(index, duration)} />
            )
            }

            {/* The hours: the slider, scrolled to where the day is busy. */}
            { mode === 'exact' && (
                <Box ref={scale}
                     role="slider"
                     tabIndex={0}
                     aria-label={`${name} time on ${date.format('dddd D MMMM')}`}
                     aria-orientation="vertical"
                     aria-valuemin={FIRST_MINUTE}
                     aria-valuemax={LAST_MINUTE}
                     aria-valuenow={minutes ?? undefined}
                     aria-valuetext={minutes === null
                         ? 'No time'
                         : spanLabel(time, duration)}
                     onKeyDown={key}
                     onPointerDown={press}
                     onPointerMove={move}
                     onPointerUp={release}
                     onPointerCancel={() => setDrag(null)}
                     onPointerLeave={() => setHover(null)}
                     className="card-stock-flat"
                     sx={{ position: 'relative',
                           height: VIEW,
                           overflowY: 'auto',
                           cursor: 'crosshair',
                           touchAction: 'pan-y',
                           userSelect: 'none',
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
                                                duration={stop.duration}
                                                labelTop={labels.get(stopKey(stop)) ?? 0}
                                                colour={colourOf(stopTypeId(stop), colours)}
                                                text={`${spanLabel(stop.at, stop.duration, stop.relative)} ${stop.card.title}`}
                                                caption={stop.task
                                                    ? stop.task.title
                                                    : "the card's own"}
                                                done={stopDone(stop)} />
                                    ))
                        }
                        { marks.filter(mark => mark.timed)
                               .map(mark =>
                                    (
                                        <Marker key={`mark:${mark.label}`}
                                                minutes={minutesOf(mark.at)}
                                                duration={mark.duration}
                                                labelTop={labels.get(`mark:${mark.label}`) ?? 0}
                                                colour={null}
                                                text={`${spanLabel(mark.at, mark.duration, mark.relative)} ${mark.label}`}
                                                caption="this one" />
                                    ))
                        }

                        {/* Where the pointer would put the point. */}
                        { hover !== null && !drag && hover !== minutes && (
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

                        {/* The point being set, as long as it lasts. */}
                        { shownFrom !== null && (
                            <Box aria-hidden
                                 sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                                { shownLength > 0 && (
                                    <Box className="card-stock-flat paper-ink"
                                         sx={{ position: 'absolute',
                                               left: RAIL - 5,
                                               width: 10,
                                               top: shownFrom / 60 * HOUR,
                                               height: shownLength / 60 * HOUR,
                                               borderRadius: '5px',
                                               opacity: drag
                                                   ? 0.6
                                                   : 0.85
                                            }} />
                                )
                                }
                                <Box className="card-disc card-stock paper-ink"
                                     sx={{ position: 'absolute',
                                           left: RAIL - 7,
                                           top: shownFrom / 60 * HOUR - 7,
                                           width: 14,
                                           height: 14,
                                           borderRadius: '50%'
                                        }} />
                                <Box className="card-stock-flat paper-blue"
                                     sx={{ position: 'absolute',
                                           left: TEXT,
                                           top: drag
                                               ? shownFrom / 60 * HOUR
                                               : labels.get('point') ?? 0,
                                           transform: 'translateY(-50%)',
                                           px: 0.75,
                                           py: '1px',
                                           fontSize: '0.66rem',
                                           fontWeight: 700,
                                           whiteSpace: 'nowrap',
                                           color: 'arc.onPaperStrong'
                                        }}>
                                    { name } · { clock(shownFrom) }{ shownLength > 0
                                        ? `–${clock(shownFrom + shownLength)}`
                                        : ''
                                                                   }
                                </Box>
                            </Box>
                        )
                        }
                    </Box>
                </Box>
            )
            }

            { (untimed.length > 0 || marks.some(mark => !mark.timed)) && (
                <Box sx={{ fontSize: '0.64rem', color: 'arc.onPaper', lineHeight: 1.5 }}>
                    <Box component="span"
                         sx={{ fontWeight: 700 }}>
                        No time on this day:
                    </Box>
                    { ' ' }
                    { [
                        ...untimed.map(stop => `${stop.card.title}${stop.task
                            ? ` · ${stop.task.title}`
                            : ''}${stop.duration
                                ? ` (${durationLabel(stop.duration)})`
                                : ''}`),
                        ...marks.filter(mark => !mark.timed).map(mark => `${mark.label} (this one)`),
                    ].join('; ')
                    }
                </Box>
            )
            }

            {/* A typed time is an exact one; no time is as timeless as a point gets, in either mode. */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                { mode === 'exact' && (
                    <TimePiece time={time}
                               onTime={value => onChange({ time: at(value), relative: false })} />
                )
                }
                <Piece chosen={time === null}
                       onClick={() => onChange({ time: null, relative: false })}>
                    No time
                </Piece>
            </Box>

            {/* How long it lasts, from its time — or some time in the day, with none. */}
            <Box role="group"
                 aria-label={`How long the ${name.toLowerCase()} lasts`}
                 sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
                <Typography component="span"
                            sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'arc.onPaper', mr: 0.25 }}>
                    Lasts
                </Typography>
                <Piece chosen={duration === null}
                       label="No length"
                       onClick={() => changeDuration(null)}>
                    —
                </Piece>
                { [...DURATIONS, ...(duration !== null && !DURATIONS.includes(duration)
                    ? [duration]
                    : [])]
                    .map(choice =>
                         (
                             <Piece key={choice}
                                    chosen={duration === choice}
                                    onClick={() => changeDuration(choice)}>
                                 { durationLabel(choice) }
                             </Piece>
                         ))
                }
                <Box component="span"
                     ref={custom}>
                    <Piece chosen={false}
                           label={`A length of your own for the ${name.toLowerCase()}`}
                           onClick={() => setCustomOpen(true)}>
                        Custom…
                    </Piece>
                </Box>
            </Box>
            <CustomDurationPopover anchor={customOpen
                                       ? custom.current
                                       : null}
                                   name={name}
                                   duration={duration}
                                   onSet={changeDuration}
                                   onClose={() => setCustomOpen(false)} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                { onOpenDay && (
                    <Button size="small"
                            startIcon={<OpenInFullIcon sx={{ fontSize: '0.85rem !important' }} />}
                            onClick={onOpenDay}
                            sx={{ fontSize: '0.64rem', color: 'arc.onPaper', textTransform: 'none' }}>
                        See the whole day
                    </Button>
                )
                }
                <Box sx={{ flex: 1 }} />
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
    function at(value: number | null): Dayjs | null
    {
        if (value === null || value <= 0)
            return null
        return date.hour(Math.floor(value / 60)).minute(value % 60).second(0).millisecond(0)
    }

    /**
     * Relative puts a point with a time in the place its time is in — at noon,
     * on a day with nothing timed (see gapAt). Exact keeps the time as chosen.
     */
    function changeMode(next: 'exact' | 'relative')
    {
        setMode(next)
        if (next === 'exact')
        {
            if (relative)
                onChange({ relative: false })
            return
        }
        if (minutes !== null)
            place(gapOf(items, minutes), duration)
    }

    /** Puts the point in the gap at `index`, for a point that long — see Calendar.RelativePlacement. */
    function place(index: number, length: number | null, change: PointChange = {})
    {
        const start = gapAt(items, index, length).start
        setPlacedGap({ index, minutes: start })
        onChange({ ...change, time: at(start), relative: true })
    }

    /**
     * A new length. A point placed before the first thing ends where that begins,
     * and one at noon on an empty day ends by midnight, so in Relative its start
     * moves with its length; elsewhere it starts where it did.
     */
    function changeDuration(next: number | null)
    {
        if (mode === 'relative' && gap !== null)
            place(gap, next, { duration: next })
        else
            onChange({ duration: next })
    }

    function pointerMinutes(event: React.PointerEvent<HTMLDivElement>): number
    {
        const box = event.currentTarget.getBoundingClientRect()
        const y = event.clientY - box.top + event.currentTarget.scrollTop
        return snap(y / HOUR * 60)
    }

    function press(event: React.PointerEvent<HTMLDivElement>)
    {
        // Not the scrollbar: it sits outside the content box, past clientWidth.
        const box = event.currentTarget.getBoundingClientRect()
        if (event.button !== 0 || event.clientX - box.left >= event.currentTarget.clientWidth)
            return
        const value = pointerMinutes(event)
        setDrag({ from: value, to: value })
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    function move(event: React.PointerEvent<HTMLDivElement>)
    {
        const value = pointerMinutes(event)
        setHover(value)
        if (drag)
            setDrag({ ...drag, to: value })
    }

    /** A click puts the point there and keeps its length; a drag sets both. */
    function release()
    {
        if (!drag)
            return
        const start = Math.min(drag.from, drag.to)
        const length = Math.abs(drag.to - drag.from)
        setDrag(null)
        onChange(length > 0
            ? { time: at(start), duration: length, relative: false }
            : { time: at(start), relative: false })
    }

    function key(event: React.KeyboardEvent<HTMLDivElement>)
    {
        if (event.key === 'Delete' || event.key === 'Backspace')
        {
            event.preventDefault()
            onChange({ time: null, relative: false })
            return
        }
        if (event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown'))
        {
            event.preventDefault()
            const next = (duration ?? 0) + (event.key === 'ArrowDown'
                ? 15
                : -15)
            onChange({ duration: next > 0
                           ? next
                           : null })
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
        onChange({ time: at(next), relative: false })
        // Keep the point in sight as it moves.
        const top = next / 60 * HOUR
        const view = event.currentTarget
        if (top < view.scrollTop + HOUR || top > view.scrollTop + VIEW - HOUR)
            view.scrollTo({ top: Math.max(0, top - VIEW / 2) })
    }
}

export default DatePickerTimeStep

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** One hour of the scale, in px. */
const HOUR = 30

/** How much of the day shows at once: nine hours. */
const VIEW = 9 * HOUR

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
    Home: FIRST_MINUTE,
    End: LAST_MINUTE,
}

/** The lengths offered in a click; a drag on the hours gives any other. */
const DURATIONS = [15, 30, 60, 120, 180, 240]

function minutesOf(time: Dayjs): number
{
    return time.hour() * 60 + time.minute()
}

/** Something on the day, for Calendar.RelativePlacement: from its time, for as long as it lasts. */
function placed(start: number, duration: number | null, item: OrderItem): PlacedItem<OrderItem>
{
    return { item, start, end: start + (duration ?? 0) }
}

/** To the quarter hour, kept off midnight at both ends — midnight is no time. */
function snap(value: number): number
{
    return clamp(Math.round(value / 15) * 15)
}

function clamp(value: number): number
{
    return Math.min(LAST_MINUTE, Math.max(FIRST_MINUTE, value))
}

function clock(value: number): string
{
    return `${String(Math.floor(value / 60) % 24).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
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

/**
 * "9", "930", "9:30", "9.30", "21:05", "2105" — hours and minutes, as a time
 * is typed. Null for anything that is not one.
 */
function parseClock(text: string): number | null
{
    const match = /^\s*(\d{1,2})(?:[:.]?(\d{2}))?\s*$/.exec(text)
    if (!match)
        return null
    const hours = Number(match[1])
    const minutes = Number(match[2] ?? 0)
    return hours < 24 && minutes < 60
        ? hours * 60 + minutes
        : null
}

/**
 * The time, typed, on a piece of card: what the point is set to, and where a
 * new one is written — kept on Enter or on leaving it, put back on Escape. An
 * empty piece is no time.
 */
function TimePiece({ time, onTime }: { time: Dayjs | null; onTime: (minutes: number | null) => void })
{
    const shown = time
        ? time.format('HH:mm')
        : ''
    const [typed, setTyped] = useState<string | null>(null)
    const [wrong, setWrong] = useState(false)

    return (
        <Box className="card-stock-flat"
             sx={{ display: 'flex',
                   alignItems: 'center',
                   gap: 0.5,
                   px: 0.75,
                   py: 0.35,
                   boxShadow: wrong
                       ? 'inset 0 -2px 0 var(--arc-red-deep)'
                       : undefined
                }}>
            <ScheduleIcon aria-hidden
                          sx={{ fontSize: '0.95rem', color: 'arc.onPaperMuted' }} />
            <InputBase value={typed ?? shown}
                       placeholder="--:--"
                       onFocus={() => setTyped(shown)}
                       onChange={event => setTyped(event.target.value)}
                       onBlur={keep}
                       onKeyDown={event =>
                       {
                           if (event.key === 'Enter')
                           {
                               event.preventDefault()
                               keep()
                           }
                       }}
                       inputProps={{ 'aria-label': 'Time, as hours and minutes', 'aria-invalid': wrong, inputMode: 'numeric', maxLength: 5 }}
                       sx={{ width: '5.4ch',
                             fontFamily: MONO,
                             fontSize: '0.82rem',
                             fontWeight: 600,
                             color: 'arc.onPaperStrong',
                             '& input': { p: 0 },
                             '& input::placeholder': { color: 'arc.onPaperMuted', opacity: 1 }
                          }} />
        </Box>
    )

    function keep()
    {
        if (typed === null)
            return
        const text = typed
        setTyped(null)
        if (text.trim() === '')
        {
            setWrong(false)
            onTime(null)
            return
        }
        const value = parseClock(text)
        setWrong(value === null)
        if (value !== null)
            onTime(value)
    }
}

/** A choice cut from card: raised and yellow when it is the one chosen. */
function Piece({ chosen, onClick, label, children }: { chosen: boolean; onClick: () => void; label?: string; children: React.ReactNode })
{
    return (
        <ButtonBase onClick={onClick}
                    aria-pressed={chosen}
                    aria-label={label}
                    className={chosen
                        ? 'card-stock paper-yellow'
                        : 'card-stock-flat'}
                    sx={{ px: 0.75,
                          py: 0.35,
                          fontSize: '0.64rem',
                          fontWeight: chosen
                              ? 700
                              : 500,
                          color: 'arc.onPaperStrong',
                          '&:hover': { backgroundColor: chosen
                                           ? undefined
                                           : 'arc.paperHover' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                       }}>
            { children }
        </ButtonBase>
    )
}

interface MarkerProps
{
    minutes: number

    duration: number | null

    labelTop: number

    /** The task's type colour; null for one of the subject's own points, drawn hollow. */
    colour: string | null

    text: string

    caption: string

    done?: boolean
}

function Marker({ minutes, duration, labelTop, colour, text, caption, done = false }: MarkerProps)
{
    return (
        <Box aria-hidden
             sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            { duration && (
                <Box sx={{ position: 'absolute',
                           left: RAIL - 3,
                           width: 6,
                           top: minutes / 60 * HOUR,
                           height: duration / 60 * HOUR,
                           borderRadius: '3px',
                           backgroundColor: colour ?? 'var(--arc-paper)',
                           border: colour
                               ? 'none'
                               : '1px solid var(--arc-blue-deep)',
                           opacity: 0.7
                        }} />
            )
            }
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
