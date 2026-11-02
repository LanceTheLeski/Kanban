/**
 * Task.Staging.test.ts
 *
 * Task edits held until a Save: what a staged task is, whether it was changed
 * and how its row says so, and what saveCardTasks sends to the server — which
 * calls, in which order, and how little of it a second press repeats.
 *
 * The server is faked, not called. Every API module the Save reaches is
 * replaced, and fakeServer below keeps the card's tasks as a list and the calls
 * made on it as sentences — `delete b`, `create "Plan" at 2`, `move d to 0` —
 * so that a test reads as what would have been sent.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTask, createTimeline, deleteTask, updateTask, updateTimeline } from '@ui/Features/Board/Board.APIs'
import {
    applyEdit,
    changeOf,
    isEdited,
    isNewTask,
    newStagedTask,
    newTaskSaveProgress,
    renumbered,
    saveCardTasks,
    saveTaskEdits,
    stagedFrom,
    taskKey,
    timelineOfDraft,
    type StagedTask,
    type TaskSaveProgress,
} from '@ui/Features/Board/Task/Task.Staging'
import type { TimelineDraft } from '@ui/Features/Board/Timeline/Timeline.Draft'
import { saveTags } from '@ui/Features/TagGroup/Tag/Tag.APIs'
import type { Tag } from '@ui/Entities/Tag/Tag.Types'
import type { Task, TaskType } from '@ui/Entities/Task/Task.Types'
import type { Timeline } from '@ui/Entities/Timeline/Timeline.Types'

// The HTTP client refuses to load without an address to call. Nothing here may
// call it, so it is a client with no calls in it: one that slips through fails
// at once, rather than going to the network.
vi.mock('@ui/Lib/Client', () => ({ ARC: '/arcstrides', apiClient: {} }))

vi.mock('@ui/Features/Board/Board.APIs', async importOriginal =>
({
    ...await importOriginal<typeof import('@ui/Features/Board/Board.APIs')>(),
    createTask: vi.fn(),
    createTimeline: vi.fn(),
    deleteTask: vi.fn(),
    updateTask: vi.fn(),
    updateTimeline: vi.fn(),
}))

vi.mock('@ui/Features/TagGroup/Tag/Tag.APIs', async importOriginal =>
({
    ...await importOriginal<typeof import('@ui/Features/TagGroup/Tag/Tag.APIs')>(),
    saveTags: vi.fn(),
}))

beforeEach(() =>
{
    vi.resetAllMocks()
})

describe('stagedFrom', () =>
{
    it('holds a stored task beside itself, with no timeline drafted and nothing changed', () =>
    {
        const stored = task('a', 0)
        const staged = stagedFrom(stored)

        expect(staged).toEqual({ task: stored, saved: stored, timelineDraft: null })
        expect(isEdited(staged)).toBe(false)
        expect(changeOf(staged)).toBeNull()
    })
})

describe('newStagedTask', () =>
{
    it('gives each new task an ID of its own and no stored task, and carries its timeline draft', () =>
    {
        const drafted = deadlineDraft()
        const first = newStagedTask(blankTask('First'), null)
        const second = newStagedTask(blankTask('Second'), drafted)

        expect(first.task.title).toBe('First')
        expect(first.saved).toBeNull()
        expect(first.timelineDraft).toBeNull()
        expect(second.timelineDraft).toBe(drafted)
        expect(second.task.id).not.toBe(first.task.id)
    })
})

describe('isNewTask', () =>
{
    it('is true for a task staged and not created yet, false for one with an ID from the server', () =>
    {
        expect(isNewTask(newStagedTask(blankTask('Plan'), null).task)).toBe(true)
        expect(isNewTask(task('7c1e0a52-3b6d-4f08-9a2e-5d41c8b0e6f3', 0))).toBe(false)
    })
})

describe('applyEdit', () =>
{
    it('keeps the timeline drafted before unless this edit drafted another', () =>
    {
        const earlier = deadlineDraft()
        const later = deadlineDraft({ requiredStartDuration: 90 })
        const staged: StagedTask = { ...stagedFrom(task('a', 0)), timelineDraft: earlier }

        expect(applyEdit(staged, { task: task('a', 0), timelineDraft: null }).timelineDraft).toBe(earlier)
        expect(applyEdit(staged, { task: task('a', 0), timelineDraft: later }).timelineDraft).toBe(later)
    })

    it('marks a task moved once its order is changed by hand, and keeps it so through a later edit', () =>
    {
        const renamed = applyEdit(stagedFrom(task('a', 0)), { task: task('a', 0, { title: 'Renamed' }), timelineDraft: null })
        const moved = applyEdit(renamed, { task: task('a', 2, { title: 'Renamed' }), timelineDraft: null })
        const renamedAgain = applyEdit(moved, { task: task('a', 2, { title: 'Renamed twice' }), timelineDraft: null })

        expect(renamed.moved).toBeFalsy()
        expect(moved.moved).toBe(true)
        expect(renamedAgain.moved).toBe(true)
    })
})

describe('timelineOfDraft', () =>
{
    it('is no timeline for a Timeless draft, whatever was stored', () =>
    {
        expect(timelineOfDraft(timeline('t-1'), draft('timeless'))).toBeNull()
        expect(timelineOfDraft(null, draft('timeless'))).toBeNull()
    })

    it('is the draft\'s dates over the stored timeline, which keeps its ID and dependency groups; with none stored, it has neither', () =>
    {
        const stored = timeline('t-1', { startDependencyTagGroupId: 'group-1', endDependencyTagGroupId: 'group-2' })
        const dates = { startDeadlineUTC: new Date('2026-11-03T15:30:00Z'), startDeadlineDurationMinutes: 30 }

        expect(timelineOfDraft(stored, deadlineDraft())).toEqual(timeline('t-1', {
            startDependencyTagGroupId: 'group-1',
            endDependencyTagGroupId: 'group-2',
            ...dates,
        }))
        expect(timelineOfDraft(null, deadlineDraft())).toEqual(timeline(null, dates))
    })
})

describe('isEdited', () =>
{
    it('is true for a task not created yet', () =>
    {
        expect(isEdited(newStagedTask(blankTask('Plan'), null))).toBe(true)
    })

    it('is false for a task with nothing changed, and counts a done that was never set as not done', () =>
    {
        expect(isEdited(stagedFrom(task('a', 0)))).toBe(false)
        expect(isEdited(edited(task('a', 0, { isCompleted: null }), { isCompleted: false }))).toBe(false)
    })

    it('is true once its title, type, done or place differs from the stored one', () =>
    {
        const stored = task('a', 0, { taskType: taskType(1) })

        expect(isEdited(edited(stored, { title: 'Renamed' }))).toBe(true)
        expect(isEdited(edited(stored, { taskType: taskType(2) }))).toBe(true)
        expect(isEdited(edited(stored, { isCompleted: true }))).toBe(true)
        expect(isEdited(edited(stored, { order: 3 }))).toBe(true)
    })

    it('is true when the tags differ, and false when they are the same tags in another order', () =>
    {
        const stored = task('a', 0, { tags: [tag('t1', 'Urgent'), tag('t2', 'Blocked')] })

        expect(isEdited(edited(stored, { tags: [tag('t1', 'Urgent')] }))).toBe(true)
        expect(isEdited(edited(stored, { tags: [tag('t2', 'Blocked'), tag('t1', 'Urgent')] }))).toBe(false)
    })

    it('is false for an edit made and then undone: title, type, done, place and tags', () =>
    {
        const stored = task('a', 0, { taskType: taskType(1), tags: [tag('t1', 'Urgent')] })
        const changed = applyEdit(stagedFrom(stored), {
            task: { ...stored, title: 'Renamed', taskType: taskType(2), isCompleted: true, order: 2, tags: [] },
            timelineDraft: null,
        })
        const undone = applyEdit(changed, { task: stored, timelineDraft: null })

        expect(isEdited(changed)).toBe(true)
        expect(isEdited(undone)).toBe(false)
    })
})

describe('changeOf', () =>
{
    it('says a task not created yet is new', () =>
    {
        expect(changeOf(newStagedTask(blankTask('Plan'), null))).toBe('new')
    })

    it('says a task whose content changed is edited, even when it was moved as well', () =>
    {
        const stored = task('a', 0)

        expect(changeOf(edited(stored, { title: 'Renamed' }))).toBe('edited')
        expect(changeOf({ ...edited(stored, { title: 'Renamed', order: 2 }), moved: true })).toBe('edited')
    })

    it('says a task moved by hand, and changed in nothing else, is moved', () =>
    {
        const moved = applyEdit(stagedFrom(task('a', 0)), { task: task('a', 2), timelineDraft: null })

        expect(isEdited(moved)).toBe(true)
        expect(changeOf(moved)).toBe('moved')
    })

    it('says nothing of a task only shifted along by another moving past it, though Save puts its number right', () =>
    {
        const [first, shifted] = renumbered([added('Plan'), stagedFrom(task('a', 0))])

        expect(first.task.order).toBe(0)
        expect(shifted.task.order).toBe(1)
        expect(changeOf(shifted)).toBeNull()
        expect(isEdited(shifted)).toBe(true)
    })
})

describe('taskKey', () =>
{
    it('is the same for the same task, and different for each thing its popover is seeded from', () =>
    {
        const base = task('a', 1, {
            taskType: taskType(1),
            tags: [tag('t1', 'Urgent')],
            timeline: timeline('t-1', { startDeadlineUTC: new Date('2026-11-03T15:30:00Z') }),
        })
        const keys =
        [
            taskKey(base),
            taskKey({ ...base, id: 'b' }),
            taskKey({ ...base, order: 2 }),
            taskKey({ ...base, isCompleted: true }),
            taskKey({ ...base, title: 'Renamed' }),
            taskKey({ ...base, taskType: taskType(2) }),
            taskKey({ ...base, timeline: null }),
            taskKey({ ...base, timeline: timeline('t-1', { startDeadlineUTC: new Date('2026-11-04T15:30:00Z') }) }),
            taskKey({ ...base, tags: [tag('t1', 'Urgent'), tag('t2', 'Blocked')] }),
        ]

        expect(taskKey({ ...base })).toBe(keys[0])
        expect(new Set(keys).size).toBe(keys.length)
    })
})

describe('renumbered', () =>
{
    it('gives each task its place in the list as its order, from 0, and leaves one already in place as it was', () =>
    {
        const inPlace = stagedFrom(task('a', 0))
        const list = renumbered([inPlace, stagedFrom(task('c', 5)), added('Plan')])

        expect(list.map(entry => entry.task.order)).toEqual([0, 1, 2])
        expect(list[0]).toBe(inPlace)
    })
})

describe('saveTaskEdits', () =>
{
    it('patches only the fields that changed', async () =>
    {
        const stored = task('a', 0)
        const server = fakeServer([stored])

        await saveTaskEdits('board-1', 'card-1', edited(stored, { title: 'Renamed' }))

        expect(server.calls).toEqual(['edit a {"title":"Renamed"}'])
    })

    it('patches a type as typeID and done as isComplete', async () =>
    {
        const stored = task('a', 0, { taskType: taskType(1) })
        const server = fakeServer([stored])

        await saveTaskEdits('board-1', 'card-1', edited(stored, { taskType: taskType(3), isCompleted: true }))

        expect(server.calls).toEqual(['edit a {"typeID":3,"isComplete":true}'])
    })

    it('patches nothing when nothing changed, and never the order', async () =>
    {
        const stored = task('a', 0)
        const server = fakeServer([stored])

        await saveTaskEdits('board-1', 'card-1', edited(stored, { order: 4 }))

        expect(server.calls).toEqual([])
    })

    it('patches the timeline a stored task has in place, writing the tags it differs in after it', async () =>
    {
        const stored = task('a', 0, { timeline: timeline('t-1'), tags: [tag('t1', 'Urgent')] })
        const server = fakeServer([stored])

        await saveTaskEdits('board-1', 'card-1', { ...edited(stored, { tags: [tag('t2', 'Blocked')] }), timelineDraft: deadlineDraft() })

        expect(server.calls).toEqual(['patch timeline t-1', 'tags task a: [Urgent] -> [Blocked]'])
    })
})

describe('saveCardTasks', () =>
{
    it('writes the deletes first, then the creates, then the edits, then the moves', async () =>
    {
        const saved = storedTasks('a', 'b', 'c', 'd')
        const [a, , , d] = saved
        const server = fakeServer(saved)

        await save(saved, renumbered([stagedFrom(d), added('Plan'), edited(a, { title: 'Renamed' })]))

        expect(server.calls).toEqual([
            'delete b',
            'delete c',
            'create "Plan" at 2',
            'edit a {"title":"Renamed"}',
            'move d to 0',
            'move server-1 to 1',
        ])
        expect(server.ids()).toEqual(['d', 'server-1', 'a'])
    })

    it('creates a new task at the end, after the deletes, and then moves it to its place', async () =>
    {
        const saved = storedTasks('a', 'b', 'c')
        const [a, , c] = saved
        const server = fakeServer(saved)

        await save(saved, renumbered([added('Plan'), stagedFrom(a), stagedFrom(c)]))

        expect(server.calls).toEqual(['delete b', 'create "Plan" at 2', 'move server-1 to 0'])
        expect(server.ids()).toEqual(['server-1', 'a', 'c'])
    })

    it('sends only what changed: a task already in its place is not moved', async () =>
    {
        const saved = storedTasks('a', 'b', 'c')
        const [a, b, c] = saved
        const server = fakeServer(saved)

        await save(saved, renumbered([stagedFrom(a), edited(b, { title: 'Renamed' }), stagedFrom(c)]))

        expect(server.calls).toEqual(['edit b {"title":"Renamed"}'])
    })

    it('does not move the tasks after a deleted one, which the server moved up', async () =>
    {
        const saved = storedTasks('a', 'b', 'c')
        const [a, , c] = saved
        const server = fakeServer(saved)

        await save(saved, renumbered([stagedFrom(a), stagedFrom(c)]))

        expect(server.calls).toEqual(['delete b'])
    })

    it('sends every move on a card whose orders have gaps or repeats, though nothing is out of place', async () =>
    {
        for (const saved of [[task('a', 0), task('b', 2), task('c', 5)], [task('a', 0), task('b', 0), task('c', 1)]])
        {
            const server = fakeServer(saved)

            await save(saved, renumbered(saved.map(entry => stagedFrom(entry))))

            expect(server.calls).toEqual(['move a to 0', 'move b to 1', 'move c to 2'])
        }
    })

    it('ends in the order wanted, whatever order the card began in', async () =>
    {
        for (const wanted of permutations(['a', 'b', 'c', 'd']))
        {
            const saved = storedTasks('a', 'b', 'c', 'd')
            const server = fakeServer(saved)

            await save(saved, renumbered(wanted.map(id => stagedFrom(saved.find(entry => entry.id === id)!))))

            expect(server.ids()).toEqual(wanted)
        }
    })

    it('creates a new task with its title trimmed, a blank one named "New task", and its type and done', async () =>
    {
        fakeServer([])

        await save([], renumbered([added('  Plan  ', { taskType: taskType(3), isCompleted: true }), added('   ')]))

        expect(vi.mocked(createTask).mock.calls.map(([, , request]) => request)).toEqual([
            { title: 'Plan', taskTypeId: 3, order: 0, isComplete: true },
            { title: 'New task', taskTypeId: -1, order: 1, isComplete: false },
        ])
    })

    it('saves the tags of a new task on the task the server created', async () =>
    {
        const saved = storedTasks('a')
        const server = fakeServer(saved)

        await save(saved, renumbered([stagedFrom(saved[0]), added('Plan', { tags: [tag('t1', 'Urgent'), tag('t2', 'Blocked')] })]))

        expect(server.calls).toEqual(['create "Plan" at 1', 'tags task server-1: [] -> [Urgent, Blocked]'])
    })

    it('creates the timeline of a new task as a task\'s, with the dates it was drafted with', async () =>
    {
        const saved = storedTasks('a')
        const server = fakeServer(saved)

        await save(saved, renumbered([stagedFrom(saved[0]), added('Plan', {}, deadlineDraft())]))

        expect(server.calls).toEqual(['create "Plan" at 1', 'timeline for server-1, kind 2'])
        expect(vi.mocked(createTimeline)).toHaveBeenCalledWith('board-1', {
            parentId: 'server-1',
            timelineTypeId: 2,
            startPreferenceUTC: null,
            startPreferenceDurationMinutes: null,
            startPreferenceTimeIsRelative: false,
            startDeadlineUTC: new Date('2026-11-03T15:30:00Z'),
            startDeadlineDurationMinutes: 30,
            startDeadlineTimeIsRelative: false,
            endPreferenceUTC: null,
            endPreferenceDurationMinutes: null,
            endPreferenceTimeIsRelative: false,
            endDeadlineUTC: null,
            endDeadlineDurationMinutes: null,
            endDeadlineTimeIsRelative: false,
        })
    })

    it('creates no timeline for a new task whose draft is Timeless, and saves no tags it does not have', async () =>
    {
        const server = fakeServer([])

        await save([], [added('Plan', {}, draft('timeless'))])

        expect(server.calls).toEqual(['create "Plan" at 0'])
    })

    it('does not repeat a delete when a Save that failed part way is pressed again', async () =>
    {
        const saved = storedTasks('a', 'b', 'c')
        const server = fakeServer(saved)
        const progress = newTaskSaveProgress()
        const staged = renumbered([stagedFrom(saved[2])])
        server.failOnce('delete b')

        await expect(save(saved, staged, progress)).rejects.toThrow('delete b failed')
        expect(server.calls).toEqual(['delete a'])

        await save(saved, staged, progress)
        expect(server.calls).toEqual(['delete a', 'delete b'])
    })

    it('does not repeat a create when a Save that failed part way is pressed again', async () =>
    {
        const saved = storedTasks('a')
        const server = fakeServer(saved)
        const progress = newTaskSaveProgress()
        const staged = renumbered([stagedFrom(saved[0]), added('Plan'), added('Review')])
        server.failOnce('create "Review" at 2')

        await expect(save(saved, staged, progress)).rejects.toThrow('create "Review" at 2 failed')
        expect(server.calls).toEqual(['create "Plan" at 1'])

        await save(saved, staged, progress)
        expect(server.calls).toEqual(['create "Plan" at 1', 'create "Review" at 2'])
        expect(server.ids()).toEqual(['a', 'server-1', 'server-2'])
    })

    it('does not repeat an edit when a Save that failed part way is pressed again', async () =>
    {
        const saved = storedTasks('a', 'b')
        const [a, b] = saved
        const server = fakeServer(saved)
        const progress = newTaskSaveProgress()
        const staged = renumbered([edited(a, { title: 'First' }), edited(b, { title: 'Second' })])
        server.failOnce('edit b {"title":"Second"}')

        await expect(save(saved, staged, progress)).rejects.toThrow('edit b {"title":"Second"} failed')
        expect(server.calls).toEqual(['edit a {"title":"First"}'])

        await save(saved, staged, progress)
        expect(server.calls).toEqual(['edit a {"title":"First"}', 'edit b {"title":"Second"}'])
    })

    it('sends every move again when a Save that failed part way is pressed again', async () =>
    {
        const saved = storedTasks('a', 'b', 'c')
        const server = fakeServer(saved)
        const progress = newTaskSaveProgress()
        const staged = renumbered([stagedFrom(saved[2]), stagedFrom(saved[1]), stagedFrom(saved[0])])
        server.failOnce('move b to 1')

        await expect(save(saved, staged, progress)).rejects.toThrow('move b to 1 failed')
        expect(server.calls).toEqual(['move c to 0'])

        await save(saved, staged, progress)
        expect(server.calls).toEqual(['move c to 0', 'move c to 0', 'move b to 1', 'move a to 2'])
        expect(server.ids()).toEqual(['c', 'b', 'a'])
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A task as stored, on a card, at a place in it. */
function task(id: string, order: number, changes: Partial<Task> = {}): Task
{
    return { id, title: `Task ${id}`, order, taskType: null, isCompleted: false, timeline: null, tags: [], ...changes }
}

/** A card's stored tasks, in the order given, numbered from 0. */
function storedTasks(...ids: string[]): Task[]
{
    return ids.map((id, index) => task(id, index))
}

/** A task of a type. */
function taskType(id: number): TaskType
{
    return { id, groupTagId: null, title: `Type ${id}`, colour: null }
}

function tag(id: string, title: string): Tag
{
    return { id, title, colour: null }
}

/** A stored task staged with changes made to it, as a popover's Done would. */
function edited(saved: Task, changes: Partial<Task>): StagedTask & { saved: Task }
{
    return { task: { ...saved, ...changes }, saved, timelineDraft: null }
}

/** What a popover adds, before it has an ID. */
function blankTask(title: string, changes: Partial<Task> = {}): Omit<Task, 'id'>
{
    return { title, order: 0, taskType: null, isCompleted: false, timeline: null, tags: [], ...changes }
}

/** A task added in the editor, with a timeline draft if it was given one. */
function added(title: string, changes: Partial<Task> = {}, timelineDraft: TimelineDraft | null = null): StagedTask
{
    return newStagedTask(blankTask(title, changes), timelineDraft)
}

/** A stored timeline with no points, or the points given. */
function timeline(id: string | null, changes: Partial<Timeline> = {}): Timeline
{
    return {
        id,
        startDependencyTagGroupId: null,
        startPreferenceUTC: null,
        startPreferenceDurationMinutes: null,
        startPreferenceTimeIsRelative: false,
        startDeadlineUTC: null,
        startDeadlineDurationMinutes: null,
        startDeadlineTimeIsRelative: false,
        endDependencyTagGroupId: null,
        endPreferenceUTC: null,
        endPreferenceDurationMinutes: null,
        endPreferenceTimeIsRelative: false,
        endDeadlineUTC: null,
        endDeadlineDurationMinutes: null,
        endDeadlineTimeIsRelative: false,
        ...changes,
    }
}

/** A draft in a mode with no points set, or the ones given. */
function draft(mode: TimelineDraft['mode'], changes: Partial<TimelineDraft> = {}): TimelineDraft
{
    return {
        mode,
        preferredStart: null,
        preferredEnd: null,
        requiredStart: null,
        requiredEnd: null,
        preferredStartTime: null,
        preferredEndTime: null,
        requiredStartTime: null,
        requiredEndTime: null,
        preferredStartDuration: null,
        preferredEndDuration: null,
        requiredStartDuration: null,
        requiredEndDuration: null,
        preferredStartRelative: false,
        preferredEndRelative: false,
        requiredStartRelative: false,
        requiredEndRelative: false,
        ...changes,
    }
}

/** A deadline on 3 November 2026 at 09:30 Chicago time, lasting half an hour. */
function deadlineDraft(changes: Partial<TimelineDraft> = {}): TimelineDraft
{
    return draft('deadline', { requiredStart: new Date('2026-11-03T15:30:00Z'), requiredStartDuration: 30, ...changes })
}

/** saveCardTasks for the card the tests use. */
function save(saved: Task[], staged: StagedTask[], progress: TaskSaveProgress = newTaskSaveProgress()): Promise<void>
{
    return saveCardTasks('board-1', 'card-1', saved, staged, progress)
}

/** Every order the IDs can come in. */
function permutations(ids: string[]): string[][]
{
    if (ids.length <= 1)
        return [ids]
    return ids.flatMap(id => permutations(ids.filter(other => other !== id)).map(rest => [id, ...rest]))
}

/** A server with a card's tasks on it, and the calls made on it so far. */
interface FakeServer
{
    /** Each call that went through, in order, as a sentence. */
    calls: string[]

    /** The card's task IDs on the server now, first to last. */
    ids: () => string[]

    /** The next call that would be described as this fails, and changes nothing. */
    failOnce: (description: string) => void
}

/**
 * Replaces the API modules with a server holding these tasks. A task created is
 * given the ID `server-1`, then `server-2`, and goes on the end of the card; a
 * task patched with only an order is moved to that place, the others closing
 * round it; a task deleted leaves the rest in order.
 */
function fakeServer(stored: Task[]): FakeServer
{
    const calls: string[] = []
    const ids = [...stored].sort((a, b) => a.order - b.order)
                           .map(entry => entry.id)
    const failing = new Set<string>()
    let created = 0

    const happen = (description: string) =>
    {
        if (failing.delete(description))
            throw new Error(`${description} failed`)
        calls.push(description)
    }
    const titles = (tags: Tag[]) => `[${tags.map(entry => entry.title).join(', ')}]`

    vi.mocked(deleteTask)
      .mockImplementation(async (_board, _card, id) =>
      {
          happen(`delete ${id}`)
          ids.splice(ids.indexOf(id), 1)
      })
    vi.mocked(createTask)
      .mockImplementation(async (_board, _card, request) =>
      {
          happen(`create "${request.title}" at ${request.order}`)
          created += 1
          ids.push(`server-${created}`)
          return task(`server-${created}`, request.order, { title: request.title })
      })
    vi.mocked(updateTask)
      .mockImplementation(async (_board, _card, id, patch) =>
      {
          if (Object.keys(patch).length === 1 && patch.order !== undefined)
          {
              happen(`move ${id} to ${patch.order}`)
              ids.splice(ids.indexOf(id), 1)
              ids.splice(patch.order, 0, id)
          }
          else
              happen(`edit ${id} ${JSON.stringify(patch)}`)
      })
    vi.mocked(createTimeline)
      .mockImplementation(async (_board, request) =>
      {
          happen(`timeline for ${request.parentId}, kind ${request.timelineTypeId}`)
          return null
      })
    vi.mocked(updateTimeline)
      .mockImplementation(async (_board, timelineId) =>
      {
          happen(`patch timeline ${timelineId}`)
      })
    vi.mocked(saveTags)
      .mockImplementation(async (parent, savedTags, draftTags) =>
      {
          happen(`tags ${parent.kind} ${parent.id}: ${titles(savedTags)} -> ${titles(draftTags)}`)
          return draftTags
      })

    return { calls, ids: () => ids, failOnce: description => { failing.add(description) } }
}
