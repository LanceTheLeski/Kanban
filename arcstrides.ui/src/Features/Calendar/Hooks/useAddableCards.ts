/**
 * useAddableCards
 *
 * The cards that can be put on a day, and which board each is on: every card
 * on the boards the calendar knows. Which boards those are, and why it is a
 * guess, is useCalendarBoards's to say.
 *
 * Read only while `enabled`, which is while the picker is open.
 */

import { useMemo } from 'react'
import { boardLabel } from '../Calendar.Views'
import { useCalendarBoards } from './useCalendarBoards'
import type { Card } from '../../../Entities/Card/Card.Types'

export interface AddableCard
{
    card: Card
    boardTitle: string
}

interface AddableCards
{
    choices: AddableCard[]

    loading: boolean

    error: string | null
}

export function useAddableCards(boardIds: string[], enabled: boolean): AddableCards
{
    const { boards, loading, error } = useCalendarBoards(boardIds, enabled)
    const choices = useMemo(() => boards.flatMap(board => board.cards.map(card =>
    ({
        card,
        boardTitle: board.title || boardLabel(board.id),
    }))), [boards])

    return { choices, loading, error }
}

export default useAddableCards
