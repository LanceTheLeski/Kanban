/**
 * useDayDraft
 *
 * What has been changed on an opened day and not saved yet.
 *
 * Everything changed in the day overlay waits for its Save: the day's type, its
 * tags, the cards put on it or taken off, and the tasks edited from its notes
 * (whose popovers say Done rather than writing — see Task.Staging). The overlay
 * draws the day as it will be — `day` and `knownCards` here are the day and the
 * calendar's cards with the draft folded in — so what is shown is what Save
 * will write. Discard drops the draft.
 *
 * A card opened from the day is not part of it: the card editor has a Save of
 * its own, and stages its own tasks until then. A task edited both there and on
 * the day is written by whichever is saved last.
 *
 * ── Save ──────────────────────────────────────────────────────────────────────
 * One part at a time — the type, the tags, the cards off and on, then each task
 * — each through the calendar store, which updates the month as it goes, then
 * the month is read again. A part written is taken out of the draft as soon as
 * it is, so a Save that fails part way leaves only what is left to write, and
 * pressing Save again writes that.
 */

import { useState } from 'react'
import { updateTask } from '../../Board/Board.APIs'
import { applyEdit, isEdited, saveTaskEdits, stagedFrom, type StagedTask, type TaskEdit } from '../../Board/Task/Task.Staging'
import { useCalendarStore } from '../Calendar.Store'
import type { Card } from '../../../Entities/Card/Card.Types'
import type { Tag } from '../../../Entities/Tag/Tag.Types'
import type { Task } from '../../../Entities/Task/Task.Types'
import type { GridDay } from '../Calendar.Grid'

export interface DayDraft
{
    /** The day as it will be, with the draft folded in. */
    day: GridDay

    /** The calendar's cards as they will be: the staged tasks in, the cards put on the day added. */
    knownCards: Card[]

    /** Anything changed and not saved. */
    dirty: boolean

    /** How many changes are waiting, for saying so. */
    pending: number

    setType: (typeId: number) => void

    setTags: (tags: Tag[]) => void

    addCard: (card: Card) => void

    removeCard: (card: Card) => void

    /** A task edited in its popover, from one of the day's notes. */
    stageTask: (card: Card, edit: TaskEdit) => void

    /** Writes the draft. False if any of it failed; what was written is out of the draft. */
    save: () => Promise<boolean>
}

/** `knownCards` are the calendar's, as stored — see Calendar.Context. */
export function useDayDraft(day: GridDay, knownCards: Card[], onError: (message: string) => void): DayDraft
{
    const [changes, setChanges] = useState<Changes>(NO_CHANGES)
    const store =
    {
        setDayType: useCalendarStore(state => state.setDayType),
        setDayTags: useCalendarStore(state => state.setDayTags),
        addCard: useCalendarStore(state => state.addCard),
        removeCard: useCalendarStore(state => state.removeCard),
        refresh: useCalendarStore(state => state.refresh),
    }

    const withStagedTasks = (card: Card): Card =>
    {
        if (!card.tasks.some(task => changes.tasks.has(task.id)))
            return card
        return { ...card,
                 tasks: card.tasks.map(task => changes.tasks.get(task.id)?.staged.task ?? task)
                                  .sort((a, b) => a.order - b.order) }
    }

    const removed = new Set(changes.removed)
    const kept = (day.stored?.cards ?? []).filter(card => !removed.has(card.id))
    const cards = [...kept, ...changes.added.filter(card => !kept.some(other => other.id === card.id))].map(withStagedTasks)
    const typeId = changes.typeId ?? day.stored?.typeId ?? 0
    const tags = changes.tags ?? day.stored?.tags ?? []
    const stored = day.stored || cards.length > 0 || typeId !== 0 || tags.length > 0
        ? { id: day.stored?.id ?? '',
            day: day.date.date(),
            month: day.date.month(),
            year: day.date.year(),
            typeId,
            tags,
            cards }
        : null

    const pending = (changes.typeId === null
        ? 0
        : 1) + (changes.tags === null
            ? 0
            : 1) + changes.added.length + changes.removed.length + changes.tasks.size

    return {
        day: { ...day, stored },
        knownCards: [...knownCards, ...changes.added.filter(card => !knownCards.some(known => known.id === card.id))]
            .map(withStagedTasks),
        dirty: pending > 0,
        pending,
        setType: next => setChanges(current =>
        ({ ...current,
           typeId: next === (day.stored?.typeId ?? 0)
               ? null
               : next })),
        setTags: next => setChanges(current => ({ ...current, tags: next })),
        addCard: card => setChanges(current => (current.removed.includes(card.id)
            ? { ...current, removed: current.removed.filter(id => id !== card.id) }
            : { ...current, added: [...current.added, card] })),
        removeCard: card => setChanges(current => (current.added.some(added => added.id === card.id)
            ? { ...current, added: current.added.filter(added => added.id !== card.id) }
            : { ...current, removed: [...current.removed, card.id] })),
        stageTask: (card, edit) => setChanges(current =>
        {
            const saved = knownCards.flatMap(known => known.tasks).find(task => task.id === edit.task.id)
            if (!saved)
                return current
            const staged = applyEdit(current.tasks.get(saved.id)?.staged ?? stagedFrom(saved), edit)
            const tasks = new Map(current.tasks)
            if (isEdited(staged))
                tasks.set(saved.id, { card, staged })
            else
                tasks.delete(saved.id)
            return { ...current, tasks }
        }),
        save,
    }

    async function save(): Promise<boolean>
    {
        const date = day.date.date()
        let left = changes
        const done = (next: Changes) =>
        {
            left = next
            setChanges(next)
        }

        try
        {
            if (left.typeId !== null)
            {
                await store.setDayType(date, left.typeId)
                done({ ...left, typeId: null })
            }
            if (left.tags !== null)
            {
                await store.setDayTags(date, left.tags)
                done({ ...left, tags: null })
            }
            for (const cardId of left.removed)
            {
                await store.removeCard(date, cardId)
                done({ ...left, removed: left.removed.filter(id => id !== cardId) })
            }
            for (const card of left.added)
            {
                await store.addCard(date, card)
                done({ ...left, added: left.added.filter(added => added.id !== card.id) })
            }
            for (const [taskId, { card, staged }] of left.tasks)
            {
                await saveTaskEdits(card.boardId, card.id, staged as StagedTask & { saved: Task })
                // A move from a day's note is one task's: the server moves the rest round it.
                if (staged.task.order !== staged.saved!.order)
                    await updateTask(card.boardId, card.id, taskId, { order: staged.task.order })
                const tasks = new Map(left.tasks)
                tasks.delete(taskId)
                done({ ...left, tasks })
            }
            await store.refresh()
            return true
        }
        catch (error)
        {
            onError(`Saving ${day.date.format('D MMMM')} stopped part way: ${error instanceof Error
                ? error.message
                : String(error)}. What is still shown as changed was not saved; Save again to write it.`)
            return false
        }
    }
}

export default useDayDraft

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

interface Changes
{
    /** The type chosen; null while unchanged. */
    typeId: number | null

    /** The tags as edited; null while unchanged. */
    tags: Tag[] | null

    added: Card[]

    /** Cards taken off, by ID. */
    removed: string[]

    /** Tasks edited from the day's notes, by task ID, with the card each is on. */
    tasks: Map<string, { card: Card; staged: StagedTask }>
}

const NO_CHANGES: Changes = { typeId: null, tags: null, added: [], removed: [], tasks: new Map() }
