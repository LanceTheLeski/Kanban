/**
 * Calendar.Options
 *
 * The calendar's options, read once and shared: which days are the weekend,
 * what each half of the week is by default, and what has been changed about
 * each kind of day. See Calendar.DayTypes for what they do to a day, and
 * CalendarOptionsOverlay for where they are changed.
 *
 * ── Why a store of their own ─────────────────────────────────────────────────
 * Every day on the grid asks what kind of day it is, and so does the picker
 * under a timeline node, on the board, where the month's store is not loaded.
 * One read for all of them, wherever they are drawn, and every one of them
 * redrawn when the options are saved.
 *
 * Until the read comes back the defaults stand — the calendar as it was before
 * there were options — so nothing waits on it.
 */

import { create } from 'zustand'
import { fetchCalendarOptions, saveCalendarOptions } from './Calendar.APIs'
import type { DayTypeOptions } from './Calendar.DayTypes'

/** The calendar with nothing chosen: Saturday and Sunday, both of no type. */
export const DEFAULT_OPTIONS: DayTypeOptions =
{
    weekendDays: [0, 6],
    weekendTypeId: 0,
    weekdayTypeId: 0,
    changes: {},
}

interface CalendarOptionsState
{
    options: DayTypeOptions

    /** Reads the options, the first time it is asked; after that, nothing. */
    load: () => void

    /** Saves the options and shows them. Throws if the save fails, and keeps the old ones. */
    save: (options: DayTypeOptions) => Promise<void>
}

export const useCalendarOptions = create<CalendarOptionsState>((set) =>
({
    options: DEFAULT_OPTIONS,

    load: () =>
    {
        if (requested)
            return
        requested = true
        fetchCalendarOptions().then(options => set({ options }))
                              .catch(() =>
                              {
                                  // The defaults stand, and the next page asks again.
                                  requested = false
                              })
    },

    save: async options =>
    {
        const saved = await saveCalendarOptions(options)
        set({ options: saved })
    },
}))

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

let requested = false
