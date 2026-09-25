/**
 * MonthView
 *
 * The month grid, and the two things that open from it: a day, and a card.
 *
 * The grid is drawn from `year` and `month` alone, so it is on screen before
 * the API has answered; whatever is stored for the month is laid over it from
 * the store when it arrives. See Calendar.Store.
 *
 * Which day or card is open is held here rather than in each day, because both
 * can be opened from two places — a card from its note on the grid or from the
 * day overlay, a day from its number or from its "+ n more" — and there is one
 * of each on screen at a time. The Blazor calendar mounted a card overlay and a
 * day overlay inside every one of its 35 days to get the same effect.
 *
 * A day is held by its key, not as the object, so an open day follows the
 * month as it changes under it: a card added, a card taken off, a re-read after
 * an edit.
 */

import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useArcError } from '../../Components/useArcError'
import { DEFAULT_BOARD_ID } from '../Board/Board.Defaults'
import { MonthGrid } from './MonthGrid'
import { DayOverlay } from './DayOverlay'
import { CalendarCardOverlay } from './CalendarCardOverlay'
import { useCalendarStore } from './Calendar.Store'
import { dayOf, weeksOf, type GridDay } from './Calendar.Grid'
import type { Card } from '../../Entities/Card/Card.Types'

interface MonthViewProps {
    year: number
    /** From 0, as dayjs counts. */
    month: number
}

export const MonthView: React.FC<MonthViewProps> = ({ year, month }) => {
    const stored = useCalendarStore(state => state.stored)
    const refresh = useCalendarStore(state => state.refresh)
    const addCard = useCalendarStore(state => state.addCard)
    const removeCard = useCalendarStore(state => state.removeCard)
    const { addError } = useArcError()

    const [openDayKey, setOpenDayKey] = useState<string | null>(null)
    const [openCard, setOpenCard] = useState<Card | null>(null)

    const weeks = useMemo(() => weeksOf(dayjs(new Date(year, month, 1)), stored?.dates ?? []),
                          [year, month, stored])
    const openDay = openDayKey ? dayOf(weeks, openDayKey) : null

    // The boards "+ Add card" offers cards from. See useCardChoices for why this
    // is a guess, and what would replace it.
    const boardIds = useMemo(() => [
        DEFAULT_BOARD_ID,
        ...(stored?.dates ?? []).flatMap(date => date.cards.map(card => card.boardId)),
    ], [stored])

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

    const handleAddCard = async (day: GridDay, card: Card) => {
        try {
            await addCard(day.date.date(), card)
        } catch (error) {
            addError(`Could not put "${card.title}" on ${day.date.format('D MMMM')}: ${messageOf(error)}`)
        }
    }

    const handleRemoveCard = async (day: GridDay, card: Card) => {
        try {
            await removeCard(day.date.date(), card.id)
        } catch (error) {
            addError(`Could not take "${card.title}" off ${day.date.format('D MMMM')}: ${messageOf(error)}`)
        }
    }

    return (
        <>
            <MonthGrid weeks={weeks} onOpenDay={day => setOpenDayKey(day.key)} onOpenCard={handleOpenCard} />

            {openDay && (
                <DayOverlay day={openDay}
                            boardIds={boardIds}
                            onClose={() => setOpenDayKey(null)}
                            onOpenCard={handleOpenCard}
                            onAddCard={card => handleAddCard(openDay, card)}
                            onRemoveCard={card => handleRemoveCard(openDay, card)} />
            )}

            {/* After the day, so a card opened from a day stacks above it. */}
            {openCard && <CalendarCardOverlay card={openCard} onClose={handleCloseCard} />}
        </>
    )
}

export default MonthView

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}
