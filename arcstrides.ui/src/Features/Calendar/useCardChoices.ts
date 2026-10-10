/**
 * useCardChoices
 *
 * The cards that can be put on a day, and which board each is on: every card
 * on the boards the calendar knows. Which boards those are, and why it is a
 * guess, is useBoards's to say.
 *
 * Read only while `enabled`, which is while the picker is open.
 */

import { useMemo } from 'react'
import { boardLabel } from './Calendar.Views'
import { useBoards } from './useBoards'
import type { Card } from '../../Entities/Card/Card.Types'

export interface CardChoice
{
    card: Card
    boardTitle: string
}

interface CardChoices
{
    choices: CardChoice[]

    loading: boolean

    error: string | null
}

export function useCardChoices(boardIds: string[], enabled: boolean): CardChoices
{
    const { boards, loading, error } = useBoards(boardIds, enabled)
    const choices = useMemo(() => boards.flatMap(board => board.cards.map(card =>
    ({
        card,
        boardTitle: board.title || boardLabel(board.id),
    }))), [boards])

    return { choices, loading, error }
}

export default useCardChoices
