/**
 * Calendar.Store.ts
 *
 * Zustand store for the month on screen, and what the API holds for it.
 *
 * ── Two things, arriving at two different times ──────────────────────────────
 * Which month is on screen is known the moment the route is read, and that is
 * all the grid needs: every day of it is worked out from the calendar. What is
 * stored for that month — the cards on its days — comes back from the API a
 * moment later, or not at all. So the store keeps them apart: `year`/`month`
 * say what to draw, `stored` is laid on top when it lands, and a slow or failed
 * read never stands between the reader and the month itself.
 *
 * ── Adding goes up straight away ─────────────────────────────────────────────
 * A card put on a day shows on that day at once, then goes to the API. If the
 * upload fails the day is put back as it was and the caller is told, so what
 * is on screen never claims something the server refused. The server answers
 * with the month as it now stands, which replaces the guess.
 *
 * ── Why Zustand ──────────────────────────────────────────────────────────────
 * The same reasons as Board.Store: the month is shared by the grid, every day
 * in it and the day overlay, and after a card is edited it has to be re-read in
 * place without dropping to a loading state and unmounting whatever is open.
 */

import { create } from 'zustand'
import { addCardToDate, fetchMonthOf, removeCardFromDate } from './Calendar.APIs'
import type { Card } from '../../Entities/Card/Card.Types'
import type { CalendarDate, Month } from './Calendar.Types'

export type CalendarStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CalendarState {
    /** The month on screen. `month` from 0, as dayjs counts. */
    year: number | null
    month: number | null
    /** What the API holds for it, once read. Null until then, and after a failure. */
    stored: Month | null
    /** The state of the read — not of the month, which is always drawable. */
    status: CalendarStatus
    error: string | null

    /**
     * Shows a month and reads what is stored for it. `silent` keeps what is
     * already laid on top while it re-reads, for a refresh after an edit.
     */
    loadMonth: (year: number, month: number, options?: { silent?: boolean }) => Promise<void>

    /** Re-reads the month on screen. */
    refresh: () => Promise<void>

    /** Puts a card on a day now, then uploads it. Throws, rolled back, if the upload fails. */
    addCard: (day: number, card: Card) => Promise<void>

    /** Takes a card off a day now, then uploads that. Throws, rolled back, if it fails. */
    removeCard: (day: number, cardId: string) => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    year: null,
    month: null,
    stored: null,
    status: 'idle',
    error: null,

    loadMonth: async (year, month, options) => {
        const silent = options?.silent === true
        const sameMonth = get().year === year && get().month === month

        // A different month drops the last one's cards at once, so they are never
        // drawn, even for a frame, over days they do not belong to.
        set(silent && sameMonth
            ? { error: null }
            : { year, month, stored: sameMonth ? get().stored : null, status: 'loading', error: null })

        try {
            const stored = await fetchMonthOf(year, month)
            // Only the most recent request may write — see loadBoard.
            if (!isShowing(get(), year, month)) return
            set({ stored, status: 'ready', error: null })
        } catch (error) {
            if (!isShowing(get(), year, month)) return
            set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
        }
    },

    refresh: async () => {
        const { year, month, loadMonth } = get()
        if (year === null || month === null) return
        await loadMonth(year, month, { silent: true })
    },

    addCard: async (day, card) => {
        const { year, month } = get()
        if (year === null || month === null) return

        const before = get().stored
        set({ stored: withDay(before, year, month, day, cards => [...cards.filter(on => on.id !== card.id), card]) })

        try {
            const stored = await addCardToDate(year, month, day, card.id)
            if (isShowing(get(), year, month)) set({ stored, status: 'ready', error: null })
        } catch (error) {
            if (isShowing(get(), year, month)) set({ stored: before })
            throw error
        }
    },

    removeCard: async (day, cardId) => {
        const { year, month } = get()
        if (year === null || month === null) return

        const before = get().stored
        set({ stored: withDay(before, year, month, day, cards => cards.filter(on => on.id !== cardId)) })

        try {
            const stored = await removeCardFromDate(year, month, day, cardId)
            if (isShowing(get(), year, month)) set({ stored, status: 'ready', error: null })
        } catch (error) {
            if (isShowing(get(), year, month)) set({ stored: before })
            throw error
        }
    },
}))

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function isShowing(state: CalendarState, year: number, month: number): boolean {
    return state.year === year && state.month === month
}

/**
 * The month with one day's cards changed — adding the day if it had no row,
 * and the month if nothing had been read yet, which is exactly the state an
 * unstored month is in when its first card is added.
 */
function withDay(stored: Month | null, year: number, month: number, day: number,
                 change: (cards: Card[]) => Card[]): Month {
    const base: Month = stored ?? { id: null, year, month, dates: [] }
    const existing = base.dates.find(date => date.day === day)
    const updated: CalendarDate = existing
        ? { ...existing, cards: change(existing.cards) }
        : { id: '', day, month, year, cards: change([]) }

    return {
        ...base,
        dates: [...base.dates.filter(date => date.day !== day), updated].sort((a, b) => a.day - b.day),
    }
}
