/**
 * usePickerMonth
 *
 * One month, read for the date picker under a timeline node: the calendar's
 * days with what is put on them — the same month the calendar page reads —
 * and every card the calendar can name, for the deadlines that fall on each
 * day.
 *
 * Read on its own rather than through Calendar.Store, because the picker opens
 * on the board page as often as on the calendar, and steps through months the
 * calendar page is not showing. It reads only while `enabled`: while the
 * picker is open.
 *
 * Opened inside an editor, its cards are what the editor holds over what was
 * read — a task added and not saved yet included (Calendar.StagedCards).
 */

import { useContext, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DEFAULT_BOARD_ID } from '../../Board/Board.Defaults'
import { fetchTaskTypes } from '../../Board/Board.APIs'
import { fetchMonthOf } from '../Calendar.APIs'
import { weeksOf, type Week } from '../Calendar.Grid'
import { typeColours } from '../Calendar.Stats'
import { uniqueCards } from '../Calendar.Stops'
import { useCalendarBoards } from './useCalendarBoards'
import { StagedCardsContext } from '../Calendar.StagedCards'
import type { Card } from '../../../Entities/Card/Card.Types'
import type { Month } from '../Calendar.Types'

export interface PickerMonth
{
    weeks: Week[]

    /** Each task type's colour — see Calendar.Stats. */
    colours: Map<number, string>

    /** Every card the calendar can read: the days' own, and the boards' — see Calendar.Stops. */
    cards: Card[]

    loading: boolean

    error: string | null
}

/**
 * `month` is any day of the month to read. `boardIds` are boards to read as
 * well as the default board and the boards of the cards on the month — the
 * board the card being scheduled is on, so its own deadlines are counted.
 */
export function usePickerMonth(month: Dayjs, boardIds: string[], enabled: boolean): PickerMonth
{
    const year = month.year()
    const index = month.month()
    const key = `${year}-${index}`

    const [read, setRead] = useState<{ key: string; month: Month | null; error: string | null }>(
        { key: '', month: null, error: null })
    const colours = useTaskColours(enabled)

    useEffect(() =>
    {
        if (!enabled || read.key === key)
            return
        let current = true
        fetchMonthOf(year, index)
            .then(stored =>
            {
                if (current)
                    setRead({ key, month: stored, error: null })
            })
            .catch(error =>
            {
                if (current)
                    setRead({ key,
                              month: null,
                              error: error instanceof Error
                                  ? error.message
                                  : String(error) })
            })
        return () => { current = false }
    }, [enabled, key, year, index, read.key])

    const stored = read.key === key
        ? read.month
        : null
    const placed = useMemo(() => (stored?.dates ?? []).flatMap(date => date.cards), [stored])
    const { boards, loading: readingBoards, error: boardsError } = useCalendarBoards(
        [DEFAULT_BOARD_ID, ...boardIds, ...placed.map(card => card.boardId)], enabled)

    const weeks = useMemo(() => weeksOf(dayjs(new Date(year, index, 1)), stored?.dates ?? []), [year, index, stored])
    const staged = useContext(StagedCardsContext)
    const cards = useMemo(() => uniqueCards(placed, boards.flatMap(board => board.cards), staged), [placed, boards, staged])

    return {
        weeks,
        colours,
        cards,
        loading: enabled && (read.key !== key || readingBoards),
        error: read.key === key
            ? read.error ?? boardsError
            : null,
    }
}

export default usePickerMonth

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * Every task type's colour. The types change rarely, so they are read once for
 * every picker opened in the session; a failure leaves typed tasks in the
 * Other grey, as on the calendar page, rather than blocking the picker.
 */
function useTaskColours(enabled: boolean): Map<number, string>
{
    const [colours, setColours] = useState<Map<number, string>>(() => coloursRead ?? new Map())

    useEffect(() =>
    {
        if (!enabled || coloursRead)
            return
        let current = true
        typesRequest ??= fetchTaskTypes([0]).then(types =>
        {
            coloursRead = typeColours(types)
            return coloursRead
        })
        typesRequest
            .then(read =>
            {
                if (current)
                    setColours(read)
            })
            .catch(() =>
            {
                typesRequest = null
            })
        return () => { current = false }
    }, [enabled])

    return colours
}

let coloursRead: Map<number, string> | null = null

let typesRequest: Promise<Map<number, string>> | null = null
