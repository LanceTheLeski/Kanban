/**
 * Calendar.Stops.test.ts
 *
 * The points in time a set of cards have set, as the calendar reads them: which
 * points of a card and of its tasks are stops, which cards a day lists and what
 * is shown under each, and how the stops are told apart and named. Times are
 * written as dates and clock times ("2026-10-28T09:30", local); a date alone is
 * local midnight, which is how the UI says "no time".
 *
 * Expectations are written out — "task-a requiredEnd 10-28 17:00", not the
 * module's own stopKey — so that a change to the rule fails here rather than
 * moving the test along with it.
 */

import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
    cardsOnDay,
    isSubjects,
    pointName,
    stopKey,
    stopsOf,
    stopsOn,
    uniqueCards,
    uniqueStops,
    type Stop,
} from '@ui/Features/Calendar/Calendar.Stops'
import type { Card } from '@ui/Entities/Card/Card.Types'
import type { Task } from '@ui/Entities/Task/Task.Types'
import type { Timeline } from '@ui/Entities/Timeline/Timeline.Types'

describe('stopsOf', () =>
{
    it('makes a stop for each point of each task\'s timeline, earliest first, across cards', () =>
    {
        const planned = task('task-a', timeline({ endDeadlineUTC: at('2026-10-30T17:00'), startPreferenceUTC: at('2026-10-28T09:00') }))
        const first = card('card-1', { tasks: [planned, task('task-b')] })
        const second = card('card-2', { tasks: [task('task-c', timeline({ endPreferenceUTC: at('2026-10-29T12:00') }))] })

        const stops = stopsOf([first, second])

        expect(listed(stops)).toEqual([
            'task-a preferredStart 10-28 09:00',
            'task-c preferredEnd 10-29 12:00',
            'task-a requiredEnd 10-30 17:00',
        ])
        expect(stops[0].task).toBe(planned)
        expect(stops[0].card).toBe(first)
        expect(stops[1].card).toBe(second)
    })

    it('makes a point with a time of day a timed stop, with how long it lasts and whether it was placed in the day\'s order', () =>
    {
        const stops = stopsOf([card('card-1', { tasks: [task('task-a', timeline({ startPreferenceUTC: at('2026-10-28T09:30'),
                                                                                  startPreferenceDurationMinutes: 90,
                                                                                  startPreferenceTimeIsRelative: true,
                                                                                  endDeadlineUTC: at('2026-10-28T17:00') }))] })])

        expect(stops.map(stop => ({ timed: stop.timed, duration: stop.duration, relative: stop.relative })))
            .toEqual([{ timed: true, duration: 90, relative: true }, { timed: true, duration: null, relative: false }])
    })

    it('makes a point set with a date and no time a stop that is not timed, which can last a while but is never placed in the day\'s order', () =>
    {
        const stops = stopsOf([card('card-1', { tasks: [task('task-a', timeline({ endDeadlineUTC: at('2026-10-28'),
                                                                                  endDeadlineDurationMinutes: 120,
                                                                                  endDeadlineTimeIsRelative: true }))] })])

        expect(listed(stops)).toEqual(['task-a requiredEnd 10-28 00:00'])
        expect(stops[0].timed).toBe(false)
        expect(stops[0].duration).toBe(120)
        expect(stops[0].relative).toBe(false)
    })

    it('gives a card that keeps its own dates stops of its own, with no task, beside its tasks\' — and so does one never told, if it has some', () =>
    {
        const kept = card('card-1', { overridesTasks: true,
                                      timeline: deadline('2026-10-30T17:00'),
                                      tasks: [task('task-a', deadline('2026-10-29T12:00'))] })
        const old = card('card-2', { overridesTasks: null,
                                     timeline: deadline('2026-10-31T17:00'),
                                     tasks: [task('task-b', deadline('2026-10-29T13:00'))] })

        const stops = stopsOf([kept, old])

        expect(listed(stops)).toEqual(['task-a requiredEnd 10-29 12:00', 'task-b requiredEnd 10-29 13:00', 'card-1 requiredEnd 10-30 17:00', 'card-2 requiredEnd 10-31 17:00'])
        expect(stops[2].task).toBeNull()
        expect(stops[2].card).toBe(kept)
    })

    it('gives a card that takes its tasks\' dates no stops of its own, whatever timeline row it carries unused', () =>
    {
        const taking = card('card-1', { overridesTasks: false,
                                        timeline: deadline('2026-10-30T17:00'),
                                        tasks: [task('task-a', deadline('2026-10-29T12:00'))] })

        expect(listed(stopsOf([taking]))).toEqual(['task-a requiredEnd 10-29 12:00'])
    })
})

describe('cardsOnDay', () =>
{
    it('puts a card on the day for a task\'s point, and shows only the tasks with a point on it', () =>
    {
        const due = task('task-a', deadline('2026-10-28T17:00'))
        const later = task('task-b', deadline('2026-10-29T17:00'))
        const board = card('card-1', { tasks: [later, due] })

        const entries = cardsOnDay([], stopsOn([board], dayjs('2026-10-28')))

        expect(entries).toHaveLength(1)
        expect(entries[0].card).toBe(board)
        expect(entries[0].placed).toBe(false)
        expect(entries[0].own).toEqual([])
        expect(listed(entries[0].taskPoints)).toEqual(['task-a requiredEnd 10-28 17:00'])
        expect(entries[0].tasks.map(entry => entry.id)).toEqual(['task-a'])
    })

    it('lists a card put on the day by hand with every one of its tasks, with or without a stop, and only once', () =>
    {
        const quiet = card('card-1', { tasks: [task('task-a'), task('task-b')] })
        const busy = card('card-2', { tasks: [task('task-c', deadline('2026-10-28T17:00')), task('task-d')] })

        const entries = cardsOnDay([quiet, busy], stopsOn([busy], dayjs('2026-10-28')))

        expect(entries.map(entry =>
        ({ card: entry.card.id,
           placed: entry.placed,
           tasks: entry.tasks.map(task => task.id),
           taskPoints: entry.taskPoints.length })))
            .toEqual([
                { card: 'card-2', placed: true, tasks: ['task-c', 'task-d'], taskPoints: 1 },
                { card: 'card-1', placed: true, tasks: ['task-a', 'task-b'], taskPoints: 0 },
            ])
    })

    it('puts a card keeping its own dates on the days of them, even where no task has a point', () =>
    {
        const kept = card('card-1', { overridesTasks: true,
                                      timeline: deadline('2026-10-28T17:00'),
                                      tasks: [task('task-a', deadline('2026-10-29T17:00'))] })

        const entries = cardsOnDay([], stopsOn([kept], dayjs('2026-10-28')))

        expect(entries).toHaveLength(1)
        expect(entries[0].card).toBe(kept)
        expect(entries[0].placed).toBe(false)
        expect(listed(entries[0].own)).toEqual(['card-1 requiredEnd 10-28 17:00'])
        expect(entries[0].taskPoints).toEqual([])
        expect(entries[0].tasks).toEqual([])
    })

    it('orders the cards by their first point with a time, then those due with no time, then those only put on the day in the order put', () =>
    {
        const noon = card('noon', { tasks: [task('task-noon', deadline('2026-10-28T12:00'))] })
        const morning = card('morning', { tasks: [task('task-morning', deadline('2026-10-28T08:00'))] })
        const dateOnly = card('date-only', { tasks: [task('task-date', deadline('2026-10-28'))] })
        const putSecond = card('put-b')
        const putFirst = card('put-a')

        const entries = cardsOnDay([putSecond, putFirst], stopsOn([noon, dateOnly, morning], dayjs('2026-10-28')))

        expect(entries.map(entry => entry.card.id)).toEqual(['morning', 'noon', 'date-only', 'put-b', 'put-a'])
    })
})

describe('stopsOn', () =>
{
    it('keeps the stops on the day from its first moment to its last, earliest first', () =>
    {
        const board = card('card-1', { tasks: [
            task('task-late', deadline('2026-10-28T23:59:59')),
            task('task-after', deadline('2026-10-29')),
            task('task-noon', deadline('2026-10-28T12:00')),
            task('task-before', deadline('2026-10-27T23:59:59')),
            task('task-midnight', deadline('2026-10-28')),
        ] })

        expect(listed(stopsOn([board], dayjs('2026-10-28')))).toEqual([
            'task-midnight requiredEnd 10-28 00:00',
            'task-noon requiredEnd 10-28 12:00',
            'task-late requiredEnd 10-28 23:59',
        ])
    })

    it('reads the day where the clock is, not in UTC, and takes a day given with a time of day as the whole day', () =>
    {
        const board = card('card-1', { tasks: [
            task('task-evening-before', deadline('2026-10-27T20:00')),
            task('task-evening', deadline('2026-10-28T20:00')),
            task('task-early-after', deadline('2026-10-29T00:30')),
        ] })

        expect(listed(stopsOn([board], dayjs('2026-10-28T08:15')))).toEqual(['task-evening requiredEnd 10-28 20:00'])
    })
})

describe('uniqueCards', () =>
{
    it('keeps one copy of each card, the later list\'s where a card is in both', () =>
    {
        const day = [card('card-1', { title: 'Stale copy' }), card('card-2', { title: 'Only the day\'s' })]
        const boards = [card('card-1', { title: 'Fresh copy' }), card('card-3', { title: 'Only a board\'s' })]

        expect(uniqueCards(day, boards).map(each => each.title)).toEqual(['Fresh copy', 'Only the day\'s', 'Only a board\'s'])
    })
})

describe('uniqueStops', () =>
{
    it('keeps one copy of each stop in time order, and a card\'s own point apart from its task\'s', () =>
    {
        const board = card('card-1', { overridesTasks: true,
                                       timeline: deadline('2026-10-28T10:00'),
                                       tasks: [task('task-a', timeline({ startPreferenceUTC: at('2026-10-28T08:00'), endDeadlineUTC: at('2026-10-28T09:00') }))] })

        const stops = uniqueStops([...stopsOf([board]).reverse(), ...stopsOf([board])])

        expect(listed(stops)).toEqual([
            'task-a preferredStart 10-28 08:00',
            'task-a requiredEnd 10-28 09:00',
            'card-1 requiredEnd 10-28 10:00',
        ])
    })
})

describe('stopKey', () =>
{
    it('names the task or the card a point is on, and which of the points it is', () =>
    {
        const board = card('card-1', { overridesTasks: true,
                                       timeline: deadline('2026-10-28T10:00'),
                                       tasks: [task('task-a', timeline({ startPreferenceUTC: at('2026-10-28T08:00'), endDeadlineUTC: at('2026-10-28T09:00') }))] })

        expect(stopsOf([board]).map(stopKey)).toEqual(['task-a:preferredStart', 'task-a:requiredEnd', 'card:card-1:requiredEnd'])
    })
})

describe('pointName', () =>
{
    it('calls the one point of a deadline-only timeline "Deadline", on a task or on a card', () =>
    {
        const board = card('card-1', { overridesTasks: true,
                                       timeline: deadline('2026-10-30T17:00'),
                                       tasks: [task('task-a', deadline('2026-10-29T12:00'))] })

        expect(stopsOf([board]).map(pointName)).toEqual(['Deadline', 'Deadline'])
    })

    it('gives the points of a timeline of several their full names, the required end too', () =>
    {
        const board = card('card-1', { tasks: [task('task-a', timeline({ startPreferenceUTC: at('2026-10-28T08:00'),
                                                                         startDeadlineUTC: at('2026-10-28T09:00'),
                                                                         endPreferenceUTC: at('2026-10-29T17:00'),
                                                                         endDeadlineUTC: at('2026-10-30T17:00') }))] })

        expect(stopsOf([board]).map(pointName)).toEqual(['Preferred Start', 'Required Start', 'Preferred End', 'Required End'])
    })
})

describe('isSubjects', () =>
{
    const board = card('card-1', { overridesTasks: true,
                                   timeline: deadline('2026-10-28T10:00'),
                                   tasks: [task('task-a', deadline('2026-10-28T08:00')), task('task-b', deadline('2026-10-28T09:00'))] })

    it('is the points of a task, when the subject is that task', () =>
    {
        const stops = stopsOf([board]).filter(stop => isSubjects(stop, { kind: 'task', id: 'task-a' }))

        expect(listed(stops)).toEqual(['task-a requiredEnd 10-28 08:00'])
    })

    it('is the card\'s own points, and not its tasks\', when the subject is a card', () =>
    {
        const stops = stopsOf([board]).filter(stop => isSubjects(stop, { kind: 'card', id: 'card-1' }))

        expect(listed(stops)).toEqual(['card-1 requiredEnd 10-28 10:00'])
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A timeline row with the points given set and the others not. */
function timeline(points: Partial<Timeline> = {}): Timeline
{
    return {
        id: 'timeline-1',
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
        ...points,
    }
}

/** A date and clock time, "2026-10-28T09:30", as that local moment; a date alone is local midnight. */
function at(text: string): Date
{
    return dayjs(text).toDate()
}

/** A timeline whose only point is its deadline. */
function deadline(when: string): Timeline
{
    return timeline({ endDeadlineUTC: at(when) })
}

/** A task, with the timeline given or none. */
function task(id: string, taskTimeline: Timeline | null = null): Task
{
    return { id, title: `Task ${id}`, order: 0, taskType: null, isCompleted: null, timeline: taskTimeline, tags: [] }
}

/** A card, with the fields given and the rest empty. */
function card(id: string, fields: Partial<Card> = {}): Card
{
    return {
        id,
        positionId: `position-${id}`,
        boardId: 'board-1',
        title: `Card ${id}`,
        description: '',
        columnNumber: 0,
        columnId: 'column-1',
        columnName: 'To do',
        swimlaneNumber: 0,
        swimlaneId: 'swimlane-1',
        swimlaneName: 'Main',
        positionRank: 0,
        tasks: [],
        timeline: null,
        overridesTasks: null,
        tags: [],
        ...fields,
    }
}

/** Stops as "task-a requiredEnd 10-28 17:00": whose point, which one, when; a card's own point by the card's id. */
function listed(stops: Stop[]): string[]
{
    return stops.map(stop => `${(stop.task ?? stop.card).id} ${stop.node.id} ${stop.at.format('MM-DD HH:mm')}`)
}
