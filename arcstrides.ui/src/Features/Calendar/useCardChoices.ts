/**
 * useCardChoices
 *
 * The cards that can be put on a day, and which board each is on.
 *
 * "Every card" is not something the API can answer: there is no endpoint that
 * lists boards (docs/api-gaps.md, #4). So the choices are the cards on the
 * boards the app already knows about — the default board, and every board a
 * card already on this month comes from. That covers the one-board case fully,
 * and a second board's cards become choosable once one of them is on the
 * calendar. A board picker will replace the guesswork when there is one.
 *
 * Read only while `enabled`, which is while the picker is open: a month view
 * with the overlay shut should not be fetching every board it can name.
 */

import { useEffect, useState } from 'react'
import { fetchBoard } from '../Board/Board.APIs'
import type { Card } from '../../Entities/Card/Card.Types'

export interface CardChoice {
    card: Card
    boardTitle: string
}

interface CardChoices {
    choices: CardChoice[]
    loading: boolean
    error: string | null
}

export function useCardChoices(boardIds: string[], enabled: boolean): CardChoices {
    // One string, so the effect re-runs when the set of boards changes and not
    // when an array with the same boards in it is rebuilt on a render.
    const key = [...new Set(boardIds.filter(Boolean))].sort().join(',')

    const [result, setResult] = useState<{ key: string; choices: CardChoice[]; error: string | null }>(
        { key: '', choices: [], error: null })

    useEffect(() => {
        if (!enabled || !key || result.key === key) return

        let current = true
        Promise.allSettled(key.split(',').map(fetchBoard))
            .then(outcomes => {
                if (!current) return
                const boards = outcomes.flatMap(outcome => (outcome.status === 'fulfilled' ? [outcome.value] : []))
                const failed = outcomes.length - boards.length

                setResult({
                    key,
                    choices: boards.flatMap(board => board.cards.map(card => ({
                        card,
                        boardTitle: board.title || 'Untitled board',
                    }))),
                    // Some boards read is still a list worth showing; say what is missing.
                    error: failed === 0 ? null : `${failed} of ${outcomes.length} boards could not be read.`,
                })
            })

        return () => { current = false }
    }, [enabled, key, result.key])

    return {
        choices: result.key === key ? result.choices : [],
        loading: enabled && !!key && result.key !== key,
        error: result.key === key ? result.error : null,
    }
}

export default useCardChoices
