/**
 * CustomDurationPopover
 *
 * Any length for a point, typed as hours and minutes, for when none of the
 * lengths the day step offers is the one wanted.
 *
 *     How long the deadline lasts
 *     [ 1 ] h  [ 45 ] min
 *     From a minute to a week.
 *                       Cancel   Set
 *
 * Opened from "Custom…" beside the lengths, in either of the day step's modes
 * (DatePickerTimeStep). A length the offered ones lack shows among them once
 * it is set, as one a drag gave does. The API takes a minute to a week
 * (TimelineValidators); longer than that is a timeline of its own.
 */

import React, { useState } from 'react'
import { Box, Button, InputBase, Popover, Typography } from '@mui/material'
import { MONO, SERIF } from '../../../Styles/Fonts'

interface CustomDurationPopoverProps
{
    /** What it opens from; null while closed. */
    anchor: HTMLElement | null

    /** What is being set: "Deadline". */
    name: string

    /** The point's length now, in minutes, to start from. */
    duration: number | null

    onSet: (minutes: number) => void

    onClose: () => void
}

export const CustomDurationPopover: React.FC<CustomDurationPopoverProps> = ({ anchor, name, duration, onSet, onClose }) => (
    <Popover open={anchor !== null}
             anchorEl={anchor}
             onClose={onClose}
             anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
             transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
             slotProps={{ paper: { className: 'card-stock',
                                   role: 'dialog',
                                   'aria-label': `How long the ${name.toLowerCase()} lasts`,
                                   sx: { p: 1.25, width: 230 }
                                }
                       }}>
        {/* Mounted with the popover, so each opening starts from the point's length. */}
        <Fields name={name}
                duration={duration}
                onSet={onSet}
                onClose={onClose} />
    </Popover>
)

export default CustomDurationPopover

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A week, in minutes: the longest length the API takes. */
const WEEK = 7 * 24 * 60

function Fields({ name, duration, onSet, onClose }: Omit<CustomDurationPopoverProps, 'anchor'>)
{
    const [hours, setHours] = useState(() => (duration
        ? String(Math.floor(duration / 60))
        : ''))
    const [minutes, setMinutes] = useState(() => (duration
        ? String(duration % 60)
        : ''))
    const total = minutesOf(hours, minutes)
    const [tried, setTried] = useState(false)
    const wrong = tried && total === null

    return (
        <Box component="form"
             onSubmit={event =>
             {
                 event.preventDefault()
                 setTried(true)
                 if (total !== null)
                 {
                     onSet(total)
                     onClose()
                 }
             }}
             sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography component="h3"
                        sx={{ m: 0, fontFamily: SERIF, fontSize: '0.95rem', color: 'arc.onPaperStrong' }}>
                How long the { name.toLowerCase() } lasts
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Field value={hours}
                       onChange={setHours}
                       label="Hours"
                       wrong={wrong}
                       autoFocus />
                <Typography component="span"
                            sx={{ fontSize: '0.7rem', color: 'arc.onPaper' }}>
                    h
                </Typography>
                <Field value={minutes}
                       onChange={setMinutes}
                       label="Minutes"
                       wrong={wrong} />
                <Typography component="span"
                            sx={{ fontSize: '0.7rem', color: 'arc.onPaper' }}>
                    min
                </Typography>
            </Box>
            <Typography role={wrong
                            ? 'alert'
                            : undefined}
                        sx={{ fontSize: '0.62rem',
                              color: wrong
                                  ? 'arc.paperDanger'
                                  : 'arc.onPaperMuted'
                           }}>
                { wrong
                    ? 'Give it a length from a minute to a week: whole hours, and minutes under 60.'
                    : 'From a minute to a week.'
                }
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
                <Button size="small"
                        onClick={onClose}
                        sx={{ fontSize: '0.66rem', color: 'arc.onPaper', textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button size="small"
                        type="submit"
                        className="card-stock paper-green"
                        sx={{ fontSize: '0.66rem', fontWeight: 700, color: 'arc.onPaperStrong', px: 1.5 }}>
                    Set
                </Button>
            </Box>
        </Box>
    )
}

/** The length typed, in minutes, or null when it is not one: empty, not whole, or out of range. */
function minutesOf(hours: string, minutes: string): number | null
{
    const h = hours.trim() === ''
        ? 0
        : Number(hours)
    const m = minutes.trim() === ''
        ? 0
        : Number(minutes)
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0 || m >= 60)
        return null
    const total = h * 60 + m
    return total >= 1 && total <= WEEK
        ? total
        : null
}

interface FieldProps
{
    value: string

    onChange: (value: string) => void

    label: string

    wrong: boolean

    autoFocus?: boolean
}

/** A number, typed on a piece of card, underlined red when the length is not one. */
function Field({ value, onChange, label, wrong, autoFocus = false }: FieldProps)
{
    return (
        <Box className="card-stock-flat"
             sx={{ px: 0.75,
                   py: 0.35,
                   boxShadow: wrong
                       ? 'inset 0 -2px 0 var(--arc-red-deep)'
                       : undefined
                }}>
            <InputBase value={value}
                       onChange={event => onChange(event.target.value)}
                       autoFocus={autoFocus}
                       placeholder="0"
                       inputProps={{ 'aria-label': label, 'aria-invalid': wrong, inputMode: 'numeric', maxLength: 3 }}
                       sx={{ width: '3.4ch',
                             fontFamily: MONO,
                             fontSize: '0.82rem',
                             fontWeight: 600,
                             color: 'arc.onPaperStrong',
                             '& input': { p: 0, textAlign: 'right' },
                             '& input::placeholder': { color: 'arc.onPaperMuted', opacity: 1 }
                          }} />
        </Box>
    )
}
