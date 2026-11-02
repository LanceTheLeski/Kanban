/**
 * useCalendarBoards
 *
 * The boards the calendar knows about, read whole: every card on them, with
 * its tasks and their timelines.
 *
 * "Every board" is not something the API can answer: there is no endpoint that
 * lists boards (docs/api-gaps.md, #4). So the boards are the ones the caller can
 * name — the default board, and every board a card on the month comes from.
 * That covers the one-board case fully, and a second board becomes known once
 * one of its cards is on the calendar. A board picker will replace the
 * guesswork when there is one.
 *
 * Three things read through here: the cards "+ Add card" offers (useAddableCards),
 * and the deadlines a day has — in the day overlay's cards, and in the date
 * picker under a timeline node — which are found among these boards' tasks as
 * well as the day's own cards (see Calendar.Stops).
 *
 * Read only while `enabled`: a month view with nothing open should not be
 * fetching every board it can name. `revision` reads them again when it moves —
 * pass the calendar store's, which moves with every re-read of the month, so an
 * edit made from the calendar shows here as well.
 */

import { useEffect, useState } from 'react'
import { fetchBoard, type Board } from '../../Board/Board.APIs'

interface CalendarBoards
{
    boards: Board[]

    loading: boolean

    error: string | null
}

export function useCalendarBoards(boardIds: string[], enabled: boolean, revision = 0): CalendarBoards
{
    // One string, so the effect re-runs when the set of boards changes and not
    // when an array with the same boards in it is rebuilt on a render.
    const key = [...new Set(boardIds.filter(Boolean))].sort().join(',')
    const wanted = `${key}#${revision}`

    const [result, setResult] = useState<{ key: string; wanted: string; boards: Board[]; error: string | null }>(
        { key: '', wanted: '', boards: [], error: null })

    useEffect(() =>
    {
        if (!enabled || !key || result.wanted === wanted)
            return

        let current = true
        Promise.allSettled(key.split(',').map(fetchBoard))
               .then(outcomes =>
               {
                   if (!current)
                       return
                   const boards = outcomes.flatMap(outcome => (outcome.status === 'fulfilled'
                       ? [outcome.value]
                       : []))
                   const failed = outcomes.length - boards.length
                   setResult({
                       key,
                       wanted,
                       boards,
                       // Some boards read is still worth showing; say what is missing.
                       error: failed === 0
                           ? null
                           : `${failed} of ${outcomes.length} boards could not be read.`,
                   })
               })

        return () => { current = false }
    }, [enabled, key, wanted, result.wanted])

    return {
        // While a revision is read, the boards already read stay up rather than blinking out.
        boards: result.key === key
            ? result.boards
            : NO_BOARDS,
        loading: enabled && !!key && result.wanted !== wanted,
        error: result.wanted === wanted
            ? result.error
            : null,
    }
}

export default useCalendarBoards

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** One empty list, so a caller's memo over the boards holds while nothing is read. */
const NO_BOARDS: Board[] = []
