/**
 * MonthView
 *
 * The month grid, and the two things that open from it: a day, and a card.
 *
 * Which of them is open is held here rather than in each day, because both can
 * be opened from two places — a card from its note on the grid or from the day
 * overlay, a day from its number or from its "+ n more" — and there is one of
 * each on screen at a time. The Blazor calendar mounted a card overlay and a
 * day overlay inside every one of its 35 days to get the same effect.
 *
 * A day is held by its key, not as the object. The month is re-read after a
 * card is edited, and an open day holding the object from before the re-read
 * would go on showing the card as it was.
 */

import React, { useMemo, useState } from 'react'
import { useArcError } from '../../Components/useArcError'
import { MonthGrid } from './MonthGrid'
import { DayOverlay } from './DayOverlay'
import { CalendarCardOverlay } from './CalendarCardOverlay'
import { useCalendarStore } from './Calendar.Store'
import { dayOf, weeksOf } from './Calendar.Grid'
import type { Dayjs } from 'dayjs'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Month } from './Calendar.Types'

interface MonthViewProps {
    month: Month
    start: Dayjs
}

export const MonthView: React.FC<MonthViewProps> = ({ month, start }) => {
    const refresh = useCalendarStore(state => state.refresh)
    const { addError } = useArcError()

    const [openDayKey, setOpenDayKey] = useState<string | null>(null)
    const [openCard, setOpenCard] = useState<Card | null>(null)

    const weeks = useMemo(() => weeksOf(start, month.dates), [start, month.dates])
    const openDay = openDayKey ? dayOf(weeks, openDayKey) : null

    const handleOpenCard = (card: Card) => {
        // The editor saves against the card's board. Without one there is
        // nowhere for a save to go, so say so rather than open a form that
        // cannot keep what is typed into it.
        if (!card.boardId) {
            addError(`"${card.title}" did not say which board it is on, so it cannot be opened here.`)
            return
        }
        setOpenCard(card)
    }

    const handleCloseCard = () => {
        setOpenCard(null)
        refresh()
    }

    return (
        <>
            <MonthGrid weeks={weeks} onOpenDay={day => setOpenDayKey(day.key)} onOpenCard={handleOpenCard} />

            {openDay && <DayOverlay day={openDay} onClose={() => setOpenDayKey(null)} onOpenCard={handleOpenCard} />}

            {/* After the day, so a card opened from a day stacks above it. */}
            {openCard && <CalendarCardOverlay card={openCard} onClose={handleCloseCard} />}
        </>
    )
}

export default MonthView
