/**
 * CalendarDatePicker
 *
 * Choosing when a timeline point is, from the calendar: the month first, then
 * the day.
 *
 *     [ Tue 14 Oct 2026 ] [ 14:00–16:00 ] [ Day ]    the point, under its node
 *            │
 *            ▼
 *     the month (MiniMonth) — pick a day — the day (DayTimePicker)
 *
 * The month is the calendar page's, folded down: every day's number with its
 * ring of tasks by type and a count of each, so a deadline is chosen knowing
 * what is already on the day. Picking a day always opens it: the day's hours,
 * with what is already timed on them, where a click puts the point — or a
 * typed time, or none. A time is not required; the day view is always shown.
 *
 * The piece with the time opens the day straight away, to change only that.
 * Day opens the whole day as the calendar's day view draws it (DayPreview),
 * with this point in it as it stands — so is "See the whole day" in the day.
 *
 * Mirrors: the MudDatePicker and MudTimePicker pair under each timeline mode
 * in UpdateTimelinePanel.razor, which said nothing about the days they chose
 * between.
 */

import React, { useRef, useState } from 'react'
import { Box, ButtonBase, Popover, type PopoverActions } from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ScheduleIcon from '@mui/icons-material/Schedule'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import dayjs, { type Dayjs } from 'dayjs'
import { rem } from '../../Styles/Measures'
import { MiniMonth } from './MiniMonth'
import { DayPreview } from './DayPreview'
import { DayTimePicker, type DayMark } from './DayTimePicker'
import { dayOf } from './Calendar.Grid'
import { isSubjects, stopsOn, type Subject } from './Calendar.Stops'
import { useMonthLoad } from './useMonthLoad'
import { durationLabel, spanLabel, type NodeValue } from '../Board/Timeline/Timeline.Nodes'

interface CalendarDatePickerProps
{
    /** What is being set: "Deadline", "Preferred start". */
    name: string

    value: NodeValue

    onChange: (value: NodeValue) => void

    /** The board the task is on, so its deadlines count even with none of its cards on the calendar. */
    boardId?: string

    /** The card or task being scheduled: its saved points are left out, and `others` drawn in their place. */
    subject?: Subject

    /** The task's other points, as they stand in the editor. */
    others?: { label: string; value: NodeValue }[]

    /** What is being scheduled, by name — the card's or the task's title — for the day's preview. */
    title?: string
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({ name, value, onChange, boardId, subject, others = [], title }) =>
{
    const anchor = useRef<HTMLDivElement>(null)
    const position = useRef<PopoverActions>(null)
    const [step, setStep] = useState<'month' | 'day' | null>(null)
    const [previewing, setPreviewing] = useState(false)
    const [shown, setShown] = useState<Dayjs>(() => (value.date ?? dayjs()).startOf('month'))
    const load = useMonthLoad(shown, boardId
        ? [boardId]
        : [], step !== null)

    const date = value.date
    const stored = date
        ? dayOf(load.weeks, date.format('YYYY-MM-DD'))?.stored ?? null
        : null
    const stops = date
        ? stopsOn(load.cards, date).filter(stop => !isSubjects(stop, subject))
        : []
    const marks: DayMark[] = date
        ? others.flatMap(other => (other.value.date?.isSame(date, 'day')
            ? [{ label: other.label,
                 at: other.value.time
                     ? onDay(date, other.value.time)
                     : date,
                 timed: other.value.time !== null,
                 duration: other.value.duration }]
            : []))
        : []

    // "15:00–17:00", "No time", or "No time · 2 h".
    const timeText = value.time
        ? spanLabel(value.time, value.duration)
        : `No time${value.duration
            ? ` · ${durationLabel(value.duration)}`
            : ''}`

    return (
        <>
            <Box ref={anchor}
                 sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, flex: '1 1 14rem', minWidth: 0 }}>
                <Piece icon={<CalendarMonthIcon sx={{ fontSize: '0.95rem' }} />}
                       onClick={() => open('month')}
                       label={`${name}: ${date
                           ? date.format('dddd D MMMM YYYY')
                           : 'no day yet'}. Choose a day`}
                       grow>
                    { date
                        ? date.format('ddd D MMM YYYY')
                        : 'Choose a day'
                    }
                </Piece>
                <Piece icon={<ScheduleIcon sx={{ fontSize: '0.95rem' }} />}
                       onClick={() => open('day')}
                       disabled={!date}
                       label={`${name} time: ${timeText}. Choose a time`}>
                    { timeText }
                </Piece>
                <Piece icon={<OpenInFullIcon sx={{ fontSize: '0.85rem' }} />}
                       onClick={() => setPreviewing(true)}
                       disabled={!date}
                       label={`See ${date
                           ? date.format('dddd D MMMM')
                           : 'the day'} as the calendar shows it, with the ${name.toLowerCase()} in it`}>
                    Day
                </Piece>
            </Box>

            <Popover open={step !== null}
                     anchorEl={anchor.current}
                     action={position}
                     onClose={() => setStep(null)}
                     anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                     transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                     slotProps={{ paper: { className: 'card-stock',
                                           role: 'dialog',
                                           'aria-label': step === 'day' && date
                                               ? `${name} on ${date.format('dddd D MMMM')}: choose a time`
                                               : `${name}: choose a day`,
                                           sx: { p: 1.25, width: WIDTH, maxWidth: 'calc(100vw - 32px)' }
                                        }
                               }}>
                { step === 'month' && (
                    <MiniMonth month={shown}
                               weeks={load.weeks}
                               colours={load.colours}
                               dueOn={day => stopsOn(load.cards, day).filter(stop => !isSubjects(stop, subject)).length}
                               selected={date}
                               loading={load.loading}
                               onMonth={next => setShown(next.startOf('month'))}
                               onPick={day => pick(day.date)} />
                )
                }
                { step === 'day' && date && (
                    <DayTimePicker date={date}
                                   stored={stored}
                                   name={name}
                                   time={value.time
                                       ? onDay(date, value.time)
                                       : null}
                                   stops={stops}
                                   marks={marks}
                                   colours={load.colours}
                                   duration={value.duration}
                                   onChange={change => onChange({ ...value, date, ...change })}
                                   onBack={() => go('month')}
                                   onDone={() => setStep(null)}
                                   onOpenDay={() => setPreviewing(true)} />
                )
                }
            </Popover>

            { previewing && date && (
                <DayPreview date={date}
                            title={title || name}
                            points={[{ name, value }, ...others.map(other => ({ name: other.label, value: other.value }))]}
                            subject={subject}
                            boardId={boardId}
                            onClose={() => setPreviewing(false)} />
            )
            }
        </>
    )

    // ── Private ───────────────────────────────────────────────────────────────
    // Closures over the value and the popover above, so they stay with them.

    function open(next: 'month' | 'day')
    {
        setShown((date ?? dayjs()).startOf('month'))
        setStep(next)
    }

    /** A day picked: the point moves to it, keeping its time of day, and the day opens. */
    function pick(day: Dayjs)
    {
        onChange({ ...value,
                   date: day,
                   time: value.time
                       ? onDay(day, value.time)
                       : null })
        setShown(day.startOf('month'))
        go('day')
    }

    /** Changes step, and re-places the popover, whose height has just changed under it. */
    function go(next: 'month' | 'day')
    {
        setStep(next)
        requestAnimationFrame(() => position.current?.updatePosition())
    }
}

export default CalendarDatePicker

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The picker's width: seven days of the folded month, and its padding. */
const WIDTH = rem(352)

/** A time of day, from wherever it was picked, on the given day. */
function onDay(day: Dayjs, time: Dayjs): Dayjs
{
    return day.hour(time.hour()).minute(time.minute()).second(0).millisecond(0)
}

interface PieceProps
{
    icon: React.ReactNode

    onClick: () => void

    label: string

    disabled?: boolean

    grow?: boolean

    children: React.ReactNode
}

/** One of the two buttons under the node: a piece of card with what it is set to. */
function Piece({ icon, onClick, label, disabled = false, grow = false, children }: PieceProps)
{
    return (
        <ButtonBase className="card-stock-flat"
                    onClick={onClick}
                    disabled={disabled}
                    aria-label={label}
                    aria-haspopup="dialog"
                    sx={{ flex: grow
                              ? '1 1 9rem'
                              : '0 1 6rem',
                          minWidth: 0,
                          justifyContent: 'flex-start',
                          gap: 0.75,
                          px: 1,
                          py: 0.6,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: 'arc.onPaperStrong',
                          opacity: disabled
                              ? 0.55
                              : 1,
                          '&:hover': { backgroundColor: 'arc.paperHover' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                       }}>
            { icon }
            { children }
        </ButtonBase>
    )
}
