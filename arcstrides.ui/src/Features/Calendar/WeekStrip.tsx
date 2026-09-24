/**
 * WeekStrip
 *
 * One week of the month: a strip of sand card laid across the calendar, the
 * same as a swimlane on the board, with the window showing in the gap above it.
 *
 * Mirrors: the per-week MudItem in CalendarLayout.razor, which held seven
 * 170px glass squares side by side. Seven panes of glass in a row read as a
 * wall of tiles, with nothing to say which of them belonged together; a strip
 * says "these seven are a week" by being one piece.
 *
 * ── Where the strip starts and stops ─────────────────────────────────────────
 * On the first day of the month and the last. A month does not begin on a
 * Sunday more than one time in seven, so the first and last strips are usually
 * short, and the slots beside them are left as bare glass. See Calendar.Grid
 * for why those slots are not the neighbouring months' days.
 */

import React from 'react'
import { Paper } from '@mui/material'
import { DayCell } from './DayCell'
import { CALENDAR_GAP } from './Calendar.Layout'
import type { Card } from '../../Entities/Card/Card.Types'
import type { GridDay, Week } from './Calendar.Grid'

interface WeekStripProps {
    week: Week
    /** The grid row the strip goes in. Row 1 is the weekday names. */
    row: number
    onOpenDay: (day: GridDay) => void
    onOpenCard: (card: Card) => void
}

export const WeekStrip: React.FC<WeekStripProps> = ({ week, row, onOpenDay, onOpenCard }) => {
    // A month's days are contiguous, so this is the slots from `first` to `last`.
    const days = week.days.filter((day): day is GridDay => day !== null)

    return (
        <Paper className="board-surface"
               elevation={0}
               sx={{ gridRow: row,
                     gridColumn: `${week.first + 1} / ${week.last + 2}`,
                     /*
                        Half a gap wider than its days on each side, so the sand
                        shows round the outer days the way it shows between
                        them. The padding below takes the half gap back, so
                        each day still lands exactly under its weekday's glass —
                        the strip's days and the grid's tracks are the same
                        width only while those two agree.
                     */
                     mx: -CALENDAR_GAP / 2,
                     px: CALENDAR_GAP / 2,
                     py: 0.5,
                     display: 'grid',
                     gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                     columnGap: CALENDAR_GAP }}>
            {days.map(day => (
                <DayCell key={day.key}
                         day={day}
                         onOpenDay={() => onOpenDay(day)}
                         onOpenCard={onOpenCard} />
            ))}
        </Paper>
    )
}

export default WeekStrip
