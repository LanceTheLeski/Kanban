/**
 * Calendar.Store.ts
 *
 * Zustand store for the month on screen.
 *
 * The same shape as Board.Store, for the same reasons: the month is shared by
 * the grid, every day in it and the day overlay, and after a card is edited it
 * has to be re-read in place — without dropping to the spinner and unmounting
 * whatever is open on top of it. See loadBoard's note on `silent` for how that
 * was learned.
 */

import { create } from 'zustand'
import { fetchMonth } from './Calendar.APIs'
import type { Month } from './Calendar.Types'

export type CalendarStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CalendarState {
    monthId: string | null
    month: Month | null
    status: CalendarStatus
    error: string | null

    /** Reads a month. `silent` keeps the current one on screen while it does. */
    loadMonth: (monthId: string, options?: { silent?: boolean }) => Promise<void>

    /** Re-reads the month on screen, after something on it was edited. */
    refresh: () => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    monthId: null,
    month: null,
    status: 'idle',
    error: null,

    loadMonth: async (monthId, options) => {
        const silent = options?.silent === true
        set(silent ? { error: null, monthId } : { status: 'loading', error: null, monthId })

        try {
            const month = await fetchMonth(monthId)

            // Only the most recent request may write — see loadBoard.
            if (get().monthId !== monthId) return

            set({ month, status: 'ready', error: null })
        } catch (error) {
            if (get().monthId !== monthId) return
            set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
        }
    },

    refresh: async () => {
        const { monthId, loadMonth } = get()
        if (!monthId) return
        await loadMonth(monthId, { silent: true })
    },
}))
