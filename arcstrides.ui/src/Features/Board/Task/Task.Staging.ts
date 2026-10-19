/**
 * Task.Staging
 *
 * Task edits held until a Save, rather than written as they are made.
 *
 * The card editor and the day overlay each have a Save, and everything changed
 * in them waits for it — a task added, edited, moved or deleted included. So a
 * task popover opened from one of them does not write: its button says Done
 * (Add, for a new task), and it hands back a TaskEdit, which its holder folds
 * into what it has staged. Nothing reaches the server until the holder's Save,
 * and its Discard drops the lot.
 *
 * ── What a staged task is ────────────────────────────────────────────────────
 * The task as it will be, beside the task as it is stored (null for one not
 * created yet), and its timeline as drafted. The task's own `timeline` is the
 * draft folded in (timelineOfDraft), so everything that draws the task — the
 * card's inherited dates, a day's points — draws it as it will be; the draft is
 * kept as well because that is what the timeline is written from.
 *
 * ── Writing a card's tasks ───────────────────────────────────────────────────
 * saveCardTasks, in an order the server can follow:
 *
 *   1. deletes      each moves up the card's tasks after it
 *   2. creates      each added at the end, so no two tasks share a place —
 *                   the create endpoint does not move anything to make room
 *   3. edits        title, type, done, tags, timeline: not the order
 *   4. the order    each task moved to its place, first to last
 *
 * Moving each task to its place in turn, first to last, ends in the order
 * wanted from any order to begin with, because a move never disturbs the
 * places before it. The server is followed in a list here, so a task already
 * in its place is not sent — unless the card's orders were not 0 to n−1 to
 * begin with, when every move is sent and the server numbers the card afresh.
 *
 * None of it is one transaction: there is no endpoint for a card's tasks at
 * once. A Save that fails part way has written what came before. The progress
 * record says what that was, so pressing Save again does the rest rather than
 * all of it twice.
 */

import { createTask, createTimeline, deleteTask, updateTask, type TaskPatch } from '../Board.APIs'
import { draftToTimelineDates, hasTimeline, saveTimeline, TIMELINE_PARENT_TASK, type TimelineDraft } from '../Timeline/Timeline.Draft'
import { saveTags, sameTags } from '../../TagGroup/Tag/Tag.APIs'
import type { Task } from '../../../Entities/Task/Task.Types'
import type { Timeline } from '../../../Entities/Timeline/Timeline.Types'
import { timelineKey } from '../Timeline/Timeline.Inheritance'

/** What a task popover hands back when it is staging rather than saving. */
export interface TaskEdit
{
    /** The task as edited — title, type, done, order, tags — with its timeline as drafted. */
    task: Task

    /** The timeline as edited, to be written; null when it was not touched. */
    timelineDraft: TimelineDraft | null
}

/** A task as it will be after Save, beside the task as stored. */
export interface StagedTask
{
    task: Task

    /** As stored; null for a task not created yet. */
    saved: Task | null

    /** Its timeline as edited since it was stored; null when untouched. */
    timelineDraft: TimelineDraft | null

    /** Moved by hand, in its popover — not only shifted by another task moving past it. */
    moved?: boolean
}

/** What a Save has written so far, so a second press does the rest. */
export interface TaskSaveProgress
{
    /** Staged ID of a new task → the ID the server gave it. */
    created: Map<string, string>

    deleted: Set<string>

    edited: Set<string>

    /** Moves were sent; after a failure part way, every move is sent again. */
    reordering: boolean
}

export function newTaskSaveProgress(): TaskSaveProgress
{
    return { created: new Map(), deleted: new Set(), edited: new Set(), reordering: false }
}

/** A task as stored, staged with nothing changed. */
export function stagedFrom(task: Task): StagedTask
{
    return { task, saved: task, timelineDraft: null }
}

/** A task added in a staging editor, with an ID of its own until it is created. */
export function newStagedTask(task: Omit<Task, 'id'>, timelineDraft: TimelineDraft | null): StagedTask
{
    counter += 1
    return { task: { ...task, id: `${NEW_TASK}${counter}` }, saved: null, timelineDraft }
}

/** Whether a task is one staged and not created yet. */
export function isNewTask(task: Task): boolean
{
    return task.id.startsWith(NEW_TASK)
}

/** An edit folded in. A timeline not touched this time keeps the one drafted before. */
export function applyEdit(staged: StagedTask, edit: TaskEdit): StagedTask
{
    return { ...staged,
             task: edit.task,
             timelineDraft: edit.timelineDraft ?? staged.timelineDraft,
             moved: staged.moved || edit.task.order !== staged.task.order }
}

/**
 * The timeline a draft describes, over the one stored: what a staged task's
 * `timeline` is, so it is drawn as it will be. Null for a Timeless draft.
 */
export function timelineOfDraft(existing: Timeline | null, draft: TimelineDraft): Timeline | null
{
    if (!hasTimeline(draft))
        return null
    return {
        id: existing?.id ?? null,
        startDependencyTagGroupId: existing?.startDependencyTagGroupId ?? null,
        endDependencyTagGroupId: existing?.endDependencyTagGroupId ?? null,
        ...draftToTimelineDates(draft),
    }
}

/** Whether a staged task differs from the stored one in anything Save writes, its place included. */
export function isEdited(staged: StagedTask): boolean
{
    const { task, saved } = staged
    if (!saved)
        return true
    return task.title !== saved.title
        || !!task.isCompleted !== !!saved.isCompleted
        || task.taskType?.id !== saved.taskType?.id
        || task.order !== saved.order
        || staged.timelineDraft !== null
        || !sameTags(task.tags, saved.tags)
}

/**
 * What was done to a staged task, as its row says so: added, its content
 * changed, or moved by hand. Null for a task only shifted along by another —
 * Save puts its number right all the same (isEdited).
 */
export function changeOf(staged: StagedTask): 'new' | 'edited' | 'moved' | null
{
    const { task, saved } = staged
    if (!saved)
        return 'new'
    if (isEdited({ ...staged, task: { ...task, order: saved.order } }))
        return 'edited'
    return staged.moved
        ? 'moved'
        : null
}

/**
 * A task's popover key: everything it seeds its draft from, so a staged or
 * saved change remounts it with the new values rather than leaving it holding
 * the old ones.
 */
export function taskKey(task: Task): string
{
    return [task.id,
            task.order,
            !!task.isCompleted,
            task.title,
            task.taskType?.id ?? '',
            timelineKey(task.timeline),
            task.tags.map(tag => tag.id).join(',')].join(':')
}

/**
 * Renumbers staged tasks from their place in the list: a task's order is its
 * place on its card, from 0.
 */
export function renumbered(staged: StagedTask[]): StagedTask[]
{
    return staged.map((entry, index) => (entry.task.order === index
        ? entry
        : { ...entry, task: { ...entry.task, order: index } }))
}

/**
 * Writes one stored task's edits — its title, type, done, timeline and tags —
 * and not its order, which saveCardTasks puts right for the whole card at once.
 */
export async function saveTaskEdits(boardId: string, cardId: string, staged: StagedTask & { saved: Task }): Promise<void>
{
    const { task, saved } = staged
    const patch: TaskPatch = {}
    if (task.title !== saved.title)
        patch.title = task.title
    if (task.taskType && task.taskType.id !== saved.taskType?.id)
        patch.typeID = task.taskType.id
    if (!!task.isCompleted !== !!saved.isCompleted)
        patch.isComplete = !!task.isCompleted

    if (Object.keys(patch).length > 0)
        await updateTask(boardId, cardId, saved.id, patch)
    // Created, or patched in place — see saveTimeline.
    if (staged.timelineDraft)
        await saveTimeline(boardId, { id: saved.id, kind: TIMELINE_PARENT_TASK }, saved.timeline, staged.timelineDraft)
    if (!sameTags(task.tags, saved.tags))
        await saveTags({ id: saved.id, kind: 'task' }, saved.tags, task.tags)
}

/**
 * Writes a card's staged tasks against the ones stored, in the order the header
 * gives. `saved` is the card's tasks as they were when staging began — the same
 * list on a second press, so the progress record reads against it.
 */
export async function saveCardTasks(boardId: string,
                                    cardId: string,
                                    saved: Task[],
                                    staged: StagedTask[],
                                    progress: TaskSaveProgress): Promise<void>
{
    const kept = new Set(staged.map(entry => entry.task.id))

    // 1. Deletes.
    for (const task of saved)
        if (!kept.has(task.id) && !progress.deleted.has(task.id))
        {
            await deleteTask(boardId, cardId, task.id)
            progress.deleted.add(task.id)
        }

    // The card's tasks as the server has them now, first to last.
    const onServer = [...saved].filter(task => !progress.deleted.has(task.id))
                               .sort((a, b) => a.order - b.order)
                               .map(task => task.id)
    onServer.push(...progress.created.values())

    // 2. Creates, each at the end.
    for (const entry of staged)
    {
        if (!isNewTask(entry.task) || progress.created.has(entry.task.id))
            continue
        const created = await createTask(boardId, cardId, {
            title: entry.task.title.trim() || 'New task',
            taskTypeId: entry.task.taskType?.id ?? -1,
            order: onServer.length,
            isComplete: !!entry.task.isCompleted,
        })
        progress.created.set(entry.task.id, created.id)
        onServer.push(created.id)
        if (entry.task.tags.length > 0)
            await saveTags({ id: created.id, kind: 'task' }, [], entry.task.tags)
        if (hasTimeline(entry.timelineDraft))
            await createTimeline(boardId, { parentId: created.id,
                                            timelineTypeId: TIMELINE_PARENT_TASK,
                                            ...draftToTimelineDates(entry.timelineDraft) })
    }

    // 3. Edits.
    for (const entry of staged)
    {
        if (!entry.saved || progress.edited.has(entry.task.id) || !isEdited(entry))
            continue
        await saveTaskEdits(boardId, cardId, entry as StagedTask & { saved: Task })
        progress.edited.add(entry.task.id)
    }

    // 4. The order: each task moved to its place, first to last.
    const wanted = staged.map(entry => progress.created.get(entry.task.id) ?? entry.task.id)
    // Every move is sent after a failure part way, and on a card whose orders
    // are not 0 to n−1 — left by an old bug — where the list here cannot know
    // how the server breaks the ties. The server renumbers the card on each.
    const numbered = [...saved].map(task => task.order).sort((a, b) => a - b).every((order, index) => order === index)
    const sendEvery = progress.reordering || !numbered
    progress.reordering = true
    for (const [index, id] of wanted.entries())
    {
        if (!sendEvery && onServer[index] === id)
            continue
        await updateTask(boardId, cardId, id, { order: index })
        onServer.splice(onServer.indexOf(id), 1)
        onServer.splice(index, 0, id)
    }
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const NEW_TASK = 'new-task:'

/** Counts new tasks, so each staged one has an ID of its own until it is created. */
let counter = 0
