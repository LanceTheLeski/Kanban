/**
 * Calendar.Stats.test.ts
 *
 * The colour each task type wears, and the numbers behind a day's two graphs:
 * how far along its tasks are, and how they split between types. Colours are
 * the module's palette constants — the palette is data, and "the first colour
 * of the palette" is what a rule says — while the rules' own numbers (a ring's
 * six segments, the ten count blocks) are written out.
 */

import { describe, expect, it } from 'vitest'
import type { Card } from '@ui/Entities/Card/Card.Types'
import type { Task, TaskType } from '@ui/Entities/Task/Task.Types'
import {
    colourOf,
    dayStats,
    defaultTypeColour,
    freeTypeColour,
    mostTasks,
    OTHER_COLOUR,
    TYPE_PALETTE,
    typeColours,
    type TypeSlice,
    UNTYPED_COLOUR,
} from '@ui/Features/Calendar/Calendar.Stats'

describe('typeColours', () =>
{
    it('gives types with no colour of their own the palette in ID order, not the order of the list', () =>
    {
        const colours = typeColours([taskType(30), taskType(10), taskType(20)])

        expect(colours.get(10)).toBe(TYPE_PALETTE[0])
        expect(colours.get(20)).toBe(TYPE_PALETTE[1])
        expect(colours.get(30)).toBe(TYPE_PALETTE[2])
    })

    it('gives a type the colour stored on it, whatever its place', () =>
    {
        const colours = typeColours([taskType(1, TYPE_PALETTE[5]), taskType(2)])

        expect(colours.get(1)).toBe(TYPE_PALETTE[5])
        expect(colours.get(2)).toBe(TYPE_PALETTE[0])
    })

    it('skips the colours some type has chosen, wherever that type sits in ID order', () =>
    {
        const colours = typeColours([taskType(1), taskType(2, TYPE_PALETTE[0]), taskType(3)])

        expect(colours.get(1)).toBe(TYPE_PALETTE[1])
        expect(colours.get(2)).toBe(TYPE_PALETTE[0])
        expect(colours.get(3)).toBe(TYPE_PALETTE[2])
    })

    it('takes a chosen colour out of the free list however it is spelled', () =>
    {
        const colours = typeColours([taskType(1, TYPE_PALETTE[0].toUpperCase()), taskType(2), taskType(3)])

        expect(colours.get(2)).toBe(TYPE_PALETTE[1])
        expect(colours.get(3)).toBe(TYPE_PALETTE[2])
    })

    it('gives the colour of Other to the types left over once the palette has run out', () =>
    {
        const colours = typeColours(numbered(10))

        expect(colours.get(1)).toBe(TYPE_PALETTE[0])
        expect(colours.get(8)).toBe(TYPE_PALETTE[7])
        expect(colours.get(9)).toBe(OTHER_COLOUR)
        expect(colours.get(10)).toBe(OTHER_COLOUR)
    })

    it('leaves every other type its colour when a type with a colour of its own is added', () =>
    {
        const before = typeColours([taskType(10), taskType(20), taskType(30)])
        // A new type's ID is random, so this one sorts in among the others; it wears the first colour nobody has.
        const after = typeColours([taskType(10), taskType(20), taskType(15, TYPE_PALETTE[3]), taskType(30)])

        expect(before.get(10)).toBe(TYPE_PALETTE[0])
        expect(before.get(20)).toBe(TYPE_PALETTE[1])
        expect(before.get(30)).toBe(TYPE_PALETTE[2])
        expect(after.get(10)).toBe(TYPE_PALETTE[0])
        expect(after.get(20)).toBe(TYPE_PALETTE[1])
        expect(after.get(30)).toBe(TYPE_PALETTE[2])
        expect(after.get(15)).toBe(TYPE_PALETTE[3])
    })
})

describe('defaultTypeColour', () =>
{
    it('is the colour typeColours gives a type with none of its own', () =>
    {
        const types = [taskType(30), taskType(10, TYPE_PALETTE[0]), taskType(20)]
        const colours = typeColours(types)

        expect(defaultTypeColour(taskType(20), types)).toBe(TYPE_PALETTE[1])
        expect(defaultTypeColour(taskType(30), types)).toBe(TYPE_PALETTE[2])
        expect(defaultTypeColour(taskType(20), types)).toBe(colours.get(20))
        expect(defaultTypeColour(taskType(30), types)).toBe(colours.get(30))
    })

    it('is the colour of Other for a type that comes after the palette has run out', () =>
    {
        const types = numbered(9)

        expect(defaultTypeColour(taskType(8), types)).toBe(TYPE_PALETTE[7])
        expect(defaultTypeColour(taskType(9), types)).toBe(OTHER_COLOUR)
    })
})

describe('freeTypeColour', () =>
{
    it('is the first colour of the palette with no types, and counts the colour a type with none of its own has by default as worn', () =>
    {
        expect(freeTypeColour([])).toBe(TYPE_PALETTE[0])
        expect(freeTypeColour([taskType(1)])).toBe(TYPE_PALETTE[1])
        expect(freeTypeColour([taskType(1), taskType(2)])).toBe(TYPE_PALETTE[2])
    })

    it('is the first colour no type is wearing, even when later ones are taken', () =>
    {
        const types = [taskType(1, TYPE_PALETTE[0]), taskType(2, TYPE_PALETTE[2])]

        expect(freeTypeColour(types)).toBe(TYPE_PALETTE[1])
    })

    it('is null when every colour of the palette is worn, chosen or by default', () =>
    {
        const types = [...numbered(4), taskType(5, TYPE_PALETTE[4]), taskType(6, TYPE_PALETTE[5]), taskType(7, TYPE_PALETTE[6]), taskType(8, TYPE_PALETTE[7])]

        expect(freeTypeColour(types)).toBeNull()
    })
})

describe('dayStats', () =>
{
    it('counts the tasks on every card and how many are done, a task never marked either way as not done', () =>
    {
        const feature = taskType(1)
        const stats = dayStats([card(task(feature, true), task(feature, false)), card(task(null, true), task(feature, null))], typeColours([feature]))

        expect(stats.total).toBe(4)
        expect(stats.done).toBe(2)
    })

    it('makes one slice for each type, with how many of its tasks there are and how many are done', () =>
    {
        const [one, two] = numbered(2)
        const cards = [card(...tasksOf(one, 2, 1)), card(...tasksOf(two, 1), ...tasksOf(one, 1, 1))]

        expect(dayStats(cards, typeColours([one, two])).slices).toEqual([
            { key: 'type:1', typeId: 1, title: 'Type 1', count: 3, done: 2, colour: TYPE_PALETTE[0] },
            { key: 'type:2', typeId: 2, title: 'Type 2', count: 1, done: 0, colour: TYPE_PALETTE[1] },
        ])
    })

    it('gives the tasks with no type a slice of their own, in the colour of the untyped', () =>
    {
        const stats = dayStats([card(...tasksOf(null, 2, 1))], new Map())

        expect(stats.slices).toEqual([
            { key: 'untyped', typeId: null, title: 'No type', count: 2, done: 1, colour: UNTYPED_COLOUR },
        ])
    })

    it('orders the slices by type ID, then No type, never by size', () =>
    {
        const [ten, twenty] = [taskType(10), taskType(20)]
        const cards = [card(...tasksOf(null, 9), ...tasksOf(twenty, 5), ...tasksOf(ten, 1))]

        const stats = dayStats(cards, typeColours([ten, twenty]))

        expect(stats.slices.map(slice => slice.key)).toEqual(['type:10', 'type:20', 'untyped'])
    })

    it('keeps a type in its place by ID when it has chosen a colour of its own', () =>
    {
        const [ten, twenty] = [taskType(10, TYPE_PALETTE[5]), taskType(20)]
        const stats = dayStats([card(task(twenty, false), task(ten, false))], typeColours([ten, twenty]))

        expect(stats.slices.map(slice => slice.key)).toEqual(['type:10', 'type:20'])
        expect(stats.slices.map(slice => slice.colour)).toEqual([TYPE_PALETTE[5], TYPE_PALETTE[0]])
    })

    it('folds the smallest types past six segments into one Other, last, with their tasks added up', () =>
    {
        const stats = dayStats([busyDay()], typeColours(numbered(7)))

        expect(stats.slices.map(slice => slice.key)).toEqual(['type:1', 'type:3', 'type:5', 'type:6', 'type:7', 'other'])
        expect(stats.slices[5]).toEqual({
            key: 'other',
            typeId: null,
            title: 'Other (Type 2, Type 4)',
            count: 2,
            done: 1,
            colour: OTHER_COLOUR,
        })
    })

    it('puts No type before Other when both are on the ring', () =>
    {
        const [one, two, three, four, five, six] = numbered(6)
        const day = card(
            ...tasksOf(one, 4),
            ...tasksOf(two, 3),
            ...tasksOf(three, 5),
            ...tasksOf(four, 1),
            ...tasksOf(five, 6),
            ...tasksOf(six, 2),
            ...tasksOf(null, 9),
        )

        const stats = dayStats([day], typeColours(numbered(6)))

        expect(stats.slices.map(slice => slice.key)).toEqual(['type:1', 'type:2', 'type:3', 'type:5', 'untyped', 'other'])
        expect(stats.slices[5].title).toBe('Other (Type 4, Type 6)')
    })

    it('does not fold anything when there are exactly six', () =>
    {
        const stats = dayStats([card(...numbered(6).flatMap(type => tasksOf(type, type.id)))], typeColours(numbered(6)))

        expect(stats.slices.map(slice => slice.key)).toEqual(['type:1', 'type:2', 'type:3', 'type:4', 'type:5', 'type:6'])
    })

    it('lists every type in `types`, in the same order and with nothing folded', () =>
    {
        const stats = dayStats([busyDay()], typeColours(numbered(7)))

        expect(stats.types.map(slice => slice.key)).toEqual(['type:1', 'type:2', 'type:3', 'type:4', 'type:5', 'type:6', 'type:7'])
        expect(stats.types.map(slice => slice.count)).toEqual([3, 1, 4, 1, 5, 2, 6])
    })

})

describe('colourOf', () =>
{
    const colours = new Map([[0, TYPE_PALETTE[2]], [7, TYPE_PALETTE[4]]])

    it('is the colour of the untyped for no type at all', () =>
    {
        expect(colourOf(null, colours)).toBe(UNTYPED_COLOUR)
        expect(colourOf(undefined, colours)).toBe(UNTYPED_COLOUR)
    })

    it('is the colour of Other for a type the colours do not know', () =>
    {
        expect(colourOf(99, colours)).toBe(OTHER_COLOUR)
    })

    it('is the colour of a type the colours know, and a type with the ID 0 is a type', () =>
    {
        expect(colourOf(7, colours)).toBe(TYPE_PALETTE[4])
        expect(colourOf(0, colours)).toBe(TYPE_PALETTE[2])
    })
})

describe('mostTasks', () =>
{
    it('gives back every type when there are ten or fewer', () =>
    {
        const ten = sliceCounts([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

        expect(mostTasks(ten)).toEqual(ten)
        expect(mostTasks(ten.slice(0, 4))).toEqual(ten.slice(0, 4))
        expect(mostTasks([])).toEqual([])
    })

    it('keeps the ten with the most tasks, in the order they came', () =>
    {
        const types = sliceCounts([5, 1, 6, 7, 2, 8, 9, 3, 4, 10, 11, 12])

        expect(mostTasks(types).map(slice => slice.key)).toEqual(['type:1', 'type:3', 'type:4', 'type:6', 'type:7', 'type:8', 'type:9', 'type:10', 'type:11', 'type:12'])
    })

    it('keeps the one first in the list of two with the same count', () =>
    {
        const types = sliceCounts([5, 5, 5, 2, 5, 5, 5, 2, 5, 5, 5])

        expect(mostTasks(types).map(slice => slice.key)).toEqual(['type:1', 'type:2', 'type:3', 'type:4', 'type:5', 'type:6', 'type:7', 'type:9', 'type:10', 'type:11'])
        expect(mostTasks([...types].reverse()).map(slice => slice.key)).toEqual(['type:11', 'type:10', 'type:9', 'type:8', 'type:7', 'type:6', 'type:5', 'type:3', 'type:2', 'type:1'])
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A task type with an ID, titled "Type 7" for ID 7; `colour` is the one stored on it, or none. */
function taskType(id: number, colour: string | null = null): TaskType
{
    return { id, groupTagId: null, title: `Type ${id}`, colour }
}

/** Types with the IDs 1 to `count`, none of them with a colour of their own. */
function numbered(count: number): TaskType[]
{
    return Array.from({ length: count }, (_, index) => taskType(index + 1))
}

/** One task of a type, or of no type; `done` is null for a task whose completion was never set. */
function task(type: TaskType | null, done: boolean | null): Task
{
    return { id: 'task', title: 'Task', order: 0, taskType: type, isCompleted: done, timeline: null, tags: [] }
}

/** `count` tasks of a type, the first `done` of them done. */
function tasksOf(type: TaskType | null, count: number, done: number = 0): Task[]
{
    return Array.from({ length: count }, (_, index) => task(type, index < done))
}

/** A card with these tasks. */
function card(...tasks: Task[]): Card
{
    return {
        id: 'card',
        positionId: 'position',
        boardId: 'board',
        title: 'Card',
        description: '',
        columnNumber: 0,
        columnId: 'column',
        columnName: 'Column',
        swimlaneNumber: 0,
        swimlaneId: 'swimlane',
        swimlaneName: 'Swimlane',
        positionRank: 0,
        tasks,
        timeline: null,
        overridesTasks: null,
        tags: [],
    }
}

/** A day of seven types, IDs 1 to 7, with 3, 1, 4, 1, 5, 2 and 6 tasks; the one task of type 2 is done. */
function busyDay(): Card
{
    const [one, two, three, four, five, six, seven] = numbered(7)
    return card(
        ...tasksOf(one, 3),
        ...tasksOf(two, 1, 1),
        ...tasksOf(three, 4),
        ...tasksOf(four, 1),
        ...tasksOf(five, 5),
        ...tasksOf(six, 2),
        ...tasksOf(seven, 6),
    )
}

/** Slices for the IDs 1, 2, 3 … in this order, each with the count given. */
function sliceCounts(counts: number[]): TypeSlice[]
{
    return counts.map((count, index) =>
    ({
        key: `type:${index + 1}`,
        typeId: index + 1,
        title: `Type ${index + 1}`,
        count,
        done: 0,
        colour: OTHER_COLOUR,
    }))
}
