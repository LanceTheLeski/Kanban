/**
 * TaskType.Store
 *
 * Every task type there is, and the colour each wears — one list for the whole
 * app.
 *
 * The calendar and the date picker each kept a copy, read once per browser
 * session behind a flag that outlived the page: a type made on the board page,
 * or coloured there, stayed grey on the calendar — Other's colour, for a type
 * the copy had not heard of — until something happened to refresh it, which
 * marking a task done did. Now there is one list, and it is read again whenever
 * a page that draws types opens (`load`), and changed in place when a type is
 * made or coloured here.
 *
 * Colours are worked out with the list (Calendar.Stats, typeColours): a type's
 * own, if it has one, or its slot in the palette.
 */

import { create } from 'zustand'
import { fetchTaskTypes } from '../../Board/Board.APIs'
import { typeColours } from '../../Calendar/Calendar.Stats'
import type { TaskType } from '../../../Entities/Task/Task.Types'

interface TaskTypeState
{
    types: TaskType[]

    /** Each type's colour — see typeColours. */
    colours: Map<number, string>

    /** Reads the list again. Requests made while one is out share it. */
    load: () => Promise<void>

    /** A type just made: in the list at once, without a read. */
    added: (type: TaskType) => void

    /** A type's colour just changed: in the list at once. Null for the default. */
    recoloured: (id: number, colour: string | null) => void
}

export const useTaskTypeStore = create<TaskTypeState>((set, get) =>
({
    types: [],
    colours: new Map(),

    load: () =>
    {
        loading ??= fetchTaskTypes([0])
            .then(types => set({ types, colours: typeColours(types) }))
            .catch(error => console.error('Could not load task types', error))
            .finally(() => { loading = null })
        return loading
    },

    added: type =>
    {
        const types = [...get().types.filter(existing => existing.id !== type.id), type]
        set({ types, colours: typeColours(types) })
    },

    recoloured: (id, colour) =>
    {
        const types = get().types.map(type => (type.id === id
            ? { ...type, colour }
            : type))
        set({ types, colours: typeColours(types) })
    },
}))

export default useTaskTypeStore

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The read in flight, so pages opening together read the list once. */
let loading: Promise<void> | null = null
