/**
 * DatePickerMonthStep
 *
 * The calendar page's month, folded down to fit under a timeline node.
 *
 *     ‹  October 2026  ›
 *     S   M   T   W   T   F   S
 *        (1) (2) (3)  4   5   6        a day: its number, ringed with its
 *        ●2  ●1●1 ●3                   tasks by type, and a count per type
 *     …
 *     Tue 14 Oct · ● Feature 3 · ● Bug 1 · 2 due
 *
 * Each day is drawn from what the calendar page draws it from — the tasks on
 * the cards put on it — with the same ring in the same colours, so a day looks
 * like itself in both places. Under the ring, each type's count beside a dot
 * of its colour. A day with nothing on it is only its number.
 *
 * The strip under the grid names the types for the day pointed at or focused,
 * so a colour is never the only thing saying which type is which, and counts
 * what is already due on it — from every board the calendar can read, not
 * only the day's own cards. Which points count is the caller's: the picker
 * leaves out the task being scheduled.
 *
 * The arrow keys move between days, and on into the months either side;
 * Page Up and Page Down move a month. The grid is one tab stop.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Box, ButtonBase, IconButton, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { Dayjs } from 'dayjs'
import { MONO, NUMERALS, SERIF } from '../../../Styles/Fonts'
import { TaskTypeRingChart } from '../Charts/TaskTypeRingChart'
import { dayStats, type DayStats } from '../Calendar.Stats'
import { useDayTypes } from '../Hooks/useDayTypes'
import type { GridDay, Week } from '../Calendar.Grid'

interface DatePickerMonthStepProps
{
    /** Any day of the month to draw. */
    month: Dayjs

    weeks: Week[]

    colours: Map<number, string>

    /** How many timeline points fall on a day — the strip's "n due". */
    dueOn: (date: Dayjs) => number

    selected: Dayjs | null

    onMonth: (month: Dayjs) => void

    onPick: (day: GridDay) => void

    loading?: boolean
}

export const DatePickerMonthStep: React.FC<DatePickerMonthStepProps> = ({ month, weeks, colours, dueOn, selected, onMonth, onPick, loading = false }) =>
{
    const days = weeks.flatMap(week => week.days).filter((day): day is GridDay => day !== null)
    const [focusKey, setFocusKey] = useState<string | null>(null)
    const [pointed, setPointed] = useState<string | null>(null)
    const buttons = useRef(new Map<string, HTMLButtonElement>())
    const wantFocus = useRef(false)

    // The one tab stop: the day last moved to, else the chosen day, else today, else the 1st.
    const tabKey = (days.find(day => day.key === focusKey)
                    ?? days.find(day => selected?.isSame(day.date, 'day'))
                    ?? days.find(day => day.isToday)
                    ?? days[0])?.key

    useEffect(() =>
    {
        if (!wantFocus.current || !focusKey)
            return
        const button = buttons.current.get(focusKey)
        if (button)
        {
            button.focus()
            wantFocus.current = false
        }
    })

    const shownKey = pointed ?? focusKey ?? days.find(day => selected?.isSame(day.date, 'day'))?.key
    const shown = days.find(day => day.key === shownKey) ?? null

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton size="small"
                            aria-label={`Previous month, ${month.subtract(1, 'month').format('MMMM YYYY')}`}
                            onClick={() => onMonth(month.subtract(1, 'month'))}
                            sx={{ color: 'arc.onPaper' }}>
                    <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography component="h3"
                            sx={{ flex: 1,
                                  m: 0,
                                  textAlign: 'center',
                                  fontFamily: SERIF,
                                  fontSize: '1.05rem',
                                  color: 'arc.onPaperStrong'
                               }}>
                    { month.format('MMMM YYYY') }
                </Typography>
                <IconButton size="small"
                            aria-label={`Next month, ${month.add(1, 'month').format('MMMM YYYY')}`}
                            onClick={() => onMonth(month.add(1, 'month'))}
                            sx={{ color: 'arc.onPaper' }}>
                    <ChevronRightIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box aria-hidden
                 sx={{ display: 'grid',
                       gridTemplateColumns: `repeat(7, ${CELL}px)`,
                       justifyContent: 'center'
                    }}>
                { WEEKDAY_INITIALS.map((initial, index) =>
                                       (
                                           <Typography key={index}
                                                       sx={{ fontSize: '0.6rem',
                                                             fontWeight: 700,
                                                             letterSpacing: '0.06em',
                                                             textAlign: 'center',
                                                             color: 'arc.onPaperMuted'
                                                          }}>
                                               { initial }
                                           </Typography>
                                       ))
                }
            </Box>

            <Box role="group"
                 aria-label={month.format('MMMM YYYY')}
                 onMouseLeave={() => setPointed(null)}
                 sx={{ display: 'grid',
                       gridTemplateColumns: `repeat(7, ${CELL}px)`,
                       gridAutoRows: `${CELL_HEIGHT}px`,
                       justifyContent: 'center',
                       rowGap: '2px'
                    }}>
                { weeks.flatMap(week => week.days.map((day, index) => (day
                    ? (
                          <Day key={day.key}
                               day={day}
                               stats={dayStats(day.stored?.cards ?? [], colours)}
                               chosen={selected?.isSame(day.date, 'day') ?? false}
                               tabbable={day.key === tabKey}
                               register={button => remember(day.key, button)}
                               onPick={() => onPick(day)}
                               onPoint={() => setPointed(day.key)}
                               onFocus={() => setFocusKey(day.key)}
                               onKey={event => step(event, day)} />
                      )
                    : <Box key={`${week.key}:${index}`} />)))
                }
            </Box>

            <DayStrip day={shown}
                      colours={colours}
                      due={shown
                          ? dueOn(shown.date)
                          : 0}
                      loading={loading} />
        </Box>
    )

    // ── Private ───────────────────────────────────────────────────────────────
    // Closures over the month and the focus above, so they stay with them.

    function remember(key: string, button: HTMLButtonElement | null)
    {
        if (button)
            buttons.current.set(key, button)
        else
            buttons.current.delete(key)
    }

    function step(event: React.KeyboardEvent, day: GridDay)
    {
        const by = KEY_STEPS[event.key]
        if (!by)
            return
        event.preventDefault()
        const to = by.unit === 'month'
            ? day.date.add(by.count, 'month')
            : day.date.add(by.count, 'day')
        if (!to.isSame(month, 'month'))
            onMonth(to)
        wantFocus.current = true
        setFocusKey(to.format('YYYY-MM-DD'))
    }
}

export default DatePickerMonthStep

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A day's slot: wide enough for its ring and three counts under it. */
const CELL = 46

const CELL_HEIGHT = 50

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const KEY_STEPS: Record<string, { count: number; unit: 'day' | 'month' }> =
{
    ArrowLeft: { count: -1, unit: 'day' },
    ArrowRight: { count: 1, unit: 'day' },
    ArrowUp: { count: -7, unit: 'day' },
    ArrowDown: { count: 7, unit: 'day' },
    PageUp: { count: -1, unit: 'month' },
    PageDown: { count: 1, unit: 'month' },
}

const RING = 30

const RING_THICKNESS = 3

const DISC = 22

/** Past this many types, the counts under a day end in "+"; the strip has them all. */
const COUNTS_SHOWN = 3

interface DayProps
{
    day: GridDay

    stats: DayStats

    chosen: boolean

    tabbable: boolean

    register: (button: HTMLButtonElement | null) => void

    onPick: () => void

    onPoint: () => void

    onFocus: () => void

    onKey: (event: React.KeyboardEvent) => void
}

function Day({ day, stats, chosen, tabbable, register, onPick, onPoint, onFocus, onKey }: DayProps)
{
    const type = useDayTypes().typeOf(day.date, day.stored?.typeId)
    const slices = stats.slices
    const summary = slices.map(slice => `${slice.title} ${slice.count}`).join(', ')

    return (
        <ButtonBase ref={register}
                    tabIndex={tabbable
                        ? 0
                        : -1}
                    onClick={onPick}
                    onMouseEnter={onPoint}
                    onFocus={onFocus}
                    onKeyDown={onKey}
                    aria-pressed={chosen}
                    aria-label={`${day.date.format('dddd D MMMM')}${day.isToday
                        ? ', today'
                        : ''}${summary
                            ? `: ${summary}`
                            : ''}`}
                    className={chosen
                        ? 'card-stock paper-yellow'
                        : ''}
                    sx={{ display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: '1px',
                          pt: '2px',
                          borderRadius: '2px',
                          '&:hover': { backgroundColor: chosen
                                           ? undefined
                                           : 'arc.paperHover' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: '-1px' }
                       }}>
            <TaskTypeRingChart slices={type.ring
                                   ? slices
                                   : []}
                               size={RING}
                               thickness={RING_THICKNESS}>
                <Box className={`card-disc card-stock-flat${day.isToday
                         ? ' paper-oxblood'
                         : ''}`}
                     sx={{ width: DISC,
                           height: DISC,
                           display: 'grid',
                           placeItems: 'center',
                           fontFamily: NUMERALS,
                           fontSize: '0.78rem',
                           lineHeight: 1,
                           fontWeight: 600,
                           color: day.isToday
                               ? 'var(--arc-cream)'
                               : 'arc.onPaperStrong'
                        }}>
                    { day.date.date() }
                </Box>
            </TaskTypeRingChart>

            { slices.length > 0 && (
                <Box aria-hidden
                     sx={{ display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '3px',
                           maxWidth: '100%',
                           fontFamily: MONO,
                           fontSize: '0.54rem',
                           lineHeight: 1,
                           color: 'arc.onPaper'
                        }}>
                    { slices.slice(0, COUNTS_SHOWN)
                            .map(slice =>
                                 (
                                     <Box key={slice.key}
                                          component="span"
                                          sx={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
                                         <Dot colour={slice.colour} />
                                         { slice.count }
                                     </Box>
                                 ))
                    }
                    { slices.length > COUNTS_SHOWN && '+' }
                </Box>
            )
            }
        </ButtonBase>
    )
}

function Dot({ colour }: { colour: string })
{
    return (
        <Box component="span"
             sx={{ width: 5,
                   height: 5,
                   flexShrink: 0,
                   borderRadius: '50%',
                   backgroundColor: colour
                }} />
    )
}

/** The day pointed at or focused, in words: its types by name, and what is due on it. */
function DayStrip({ day, colours, due, loading }: { day: GridDay | null; colours: Map<number, string>; due: number; loading: boolean })
{
    const stats = day
        ? dayStats(day.stored?.cards ?? [], colours)
        : null

    return (
        <Box aria-live="polite"
             sx={{ minHeight: '2.4em',
                   px: 0.5,
                   pt: 0.5,
                   borderTop: '1px solid',
                   borderTopColor: 'arc.paperDivider',
                   display: 'flex',
                   flexWrap: 'wrap',
                   alignItems: 'center',
                   columnGap: 1,
                   rowGap: 0.25,
                   fontSize: '0.66rem',
                   color: 'arc.onPaper'
                }}>
            { !day && (
                <Box component="span"
                     sx={{ color: 'arc.onPaperMuted' }}>
                    { loading
                        ? 'Reading the calendar…'
                        : 'Pick a day. The rings are its tasks by type, as on the calendar.'
                    }
                </Box>
            )
            }
            { day && (
                <>
                    <Box component="span"
                         sx={{ fontWeight: 700, color: 'arc.onPaperStrong' }}>
                        { day.date.format('ddd D MMM') }
                    </Box>
                    { stats?.slices.map(slice =>
                                        (
                                            <Box key={slice.key}
                                                 component="span"
                                                 sx={{ display: 'inline-flex',
                                                       alignItems: 'center',
                                                       gap: 0.5
                                                    }}>
                                                <Dot colour={slice.colour} />
                                                { slice.title } { slice.count }
                                            </Box>
                                        ))
                    }
                    { stats?.total === 0 && due === 0 && (
                        <Box component="span"
                             sx={{ color: 'arc.onPaperMuted' }}>
                            Nothing on this day yet.
                        </Box>
                    )
                    }
                    { due > 0 && (
                        <Box component="span"
                             sx={{ color: 'arc.onPaperMuted' }}>
                            { due } due
                        </Box>
                    )
                    }
                </>
            )
            }
        </Box>
    )
}
