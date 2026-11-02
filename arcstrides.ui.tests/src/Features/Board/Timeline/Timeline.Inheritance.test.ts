/**
 * Timeline.Inheritance.test.ts
 *
 * A card's schedule, from its tasks': which points of theirs it takes, which of
 * the card's two sets of dates it goes by, and what it says about where they
 * came from. Times are written as dates and clock times ("2026-10-28T09:30",
 * local) and read back below as "10-28 09:30".
 *
 * Expectations are written out — a card's preferred start is "10-27 10:00",
 * not the earliest of the tasks' as the module works it out — so that a change
 * to the rule fails here rather than moving the test along with it.
 */

import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
    cardSchedule,
    inheritedTimeline,
    overridesTasks,
    timelineKey,
} from '@ui/Features/Board/Timeline/Timeline.Inheritance'
import type { Card } from '@ui/Entities/Card/Card.Types'
import type { Task } from '@ui/Entities/Task/Task.Types'
import type { Timeline } from '@ui/Entities/Timeline/Timeline.Types'

describe('inheritedTimeline', () =>
{
    it('takes the earliest starts and the latest ends of its tasks, each point on its own', () =>
    {
        const result = inheritedTimeline([
            task('task-a', timeline({ startPreferenceUTC: at('2026-10-28T09:00'),
                                      startDeadlineUTC: at('2026-10-28T12:00'),
                                      endPreferenceUTC: at('2026-10-30T17:00'),
                                      endDeadlineUTC: at('2026-10-31T17:00') })),
            task('task-b', timeline({ startPreferenceUTC: at('2026-10-27T10:00'),
                                      startDeadlineUTC: at('2026-10-29T08:00'),
                                      endPreferenceUTC: at('2026-10-31T12:00'),
                                      endDeadlineUTC: at('2026-10-30T12:00') })),
        ])

        expect(shown(result)).toEqual({
            preferredStart: '10-27 10:00',
            requiredStart: '10-28 12:00',
            preferredEnd: '10-31 12:00',
            requiredEnd: '10-31 17:00',
        })
    })

    it('gives a card whose tasks are all deadlines only a required end, the last of them', () =>
    {
        const result = inheritedTimeline([
            task('task-a', deadline('2026-10-28T17:00')),
            task('task-b', deadline('2026-10-30T09:00')),
            task('task-c', deadline('2026-10-29T12:00')),
        ])

        expect(shown(result)).toEqual({
            preferredStart: null,
            requiredStart: null,
            preferredEnd: null,
            requiredEnd: '10-30 09:00',
        })
    })

    it('mixes deadlines and timelines: the starts are the timeline\'s, the end is whichever task ends last', () =>
    {
        const planned = task('task-a', timeline({ startPreferenceUTC: at('2026-10-28T09:00'),
                                                  startDeadlineUTC: at('2026-10-28T12:00'),
                                                  endPreferenceUTC: at('2026-10-29T17:00'),
                                                  endDeadlineUTC: at('2026-10-30T17:00') }))

        expect(shown(inheritedTimeline([planned, task('task-b', deadline('2026-10-31T17:00'))])))
            .toEqual({ preferredStart: '10-28 09:00', requiredStart: '10-28 12:00', preferredEnd: '10-29 17:00', requiredEnd: '10-31 17:00' })
        expect(shown(inheritedTimeline([planned, task('task-b', deadline('2026-10-29T17:00'))])))
            .toEqual({ preferredStart: '10-28 09:00', requiredStart: '10-28 12:00', preferredEnd: '10-29 17:00', requiredEnd: '10-30 17:00' })
    })

    it('keeps each point\'s length and whether it was placed in the day\'s order from the task point it came from', () =>
    {
        const result = inheritedTimeline([
            task('task-a', timeline({ startPreferenceUTC: at('2026-10-28T08:00'),
                                      startPreferenceDurationMinutes: 30,
                                      startPreferenceTimeIsRelative: true,
                                      startDeadlineUTC: at('2026-10-28T09:00'),
                                      startDeadlineDurationMinutes: 45,
                                      startDeadlineTimeIsRelative: true,
                                      endPreferenceUTC: at('2026-10-28T12:00'),
                                      endPreferenceDurationMinutes: 15,
                                      endPreferenceTimeIsRelative: false,
                                      endDeadlineUTC: at('2026-10-28T20:00'),
                                      endDeadlineDurationMinutes: 20,
                                      endDeadlineTimeIsRelative: false })),
            task('task-b', timeline({ startPreferenceUTC: at('2026-10-28T09:00'),
                                      startPreferenceDurationMinutes: 90,
                                      startPreferenceTimeIsRelative: false,
                                      startDeadlineUTC: at('2026-10-28T08:30'),
                                      startDeadlineDurationMinutes: 10,
                                      startDeadlineTimeIsRelative: false,
                                      endPreferenceUTC: at('2026-10-28T17:00'),
                                      endPreferenceDurationMinutes: 120,
                                      endPreferenceTimeIsRelative: true,
                                      endDeadlineUTC: at('2026-10-28T18:00'),
                                      endDeadlineDurationMinutes: 5,
                                      endDeadlineTimeIsRelative: true })),
        ])

        expect(result).toMatchObject({
            startPreferenceDurationMinutes: 30,
            startPreferenceTimeIsRelative: true,
            startDeadlineDurationMinutes: 10,
            startDeadlineTimeIsRelative: false,
            endPreferenceDurationMinutes: 120,
            endPreferenceTimeIsRelative: true,
            endDeadlineDurationMinutes: 20,
            endDeadlineTimeIsRelative: false,
        })
    })

    it('leaves a point none of its tasks has empty, with no length and not placed', () =>
    {
        const result = inheritedTimeline([task('task-a', timeline({ startPreferenceUTC: at('2026-10-28T09:00'),
                                                                    startPreferenceDurationMinutes: 60,
                                                                    startPreferenceTimeIsRelative: true,
                                                                    endPreferenceUTC: at('2026-10-29T17:00') }))])

        expect(shown(result)).toEqual({ preferredStart: '10-28 09:00', requiredStart: null, preferredEnd: '10-29 17:00', requiredEnd: null })
        expect(result).toMatchObject({
            startDeadlineUTC: null,
            startDeadlineDurationMinutes: null,
            startDeadlineTimeIsRelative: false,
            endDeadlineUTC: null,
            endDeadlineDurationMinutes: null,
            endDeadlineTimeIsRelative: false,
        })
    })

    it('is null when none of its tasks has a date', () =>
    {
        expect(inheritedTimeline([])).toBeNull()
        expect(inheritedTimeline([task('task-a')])).toBeNull()
        expect(inheritedTimeline([task('task-a', timeline())])).toBeNull()
    })

    it('is no row of its own, so there is nothing to patch, however many rows its tasks have', () =>
    {
        const result = inheritedTimeline([task('task-a', deadline('2026-10-28T17:00')), task('task-b', deadline('2026-10-29T17:00'))])

        expect(result?.id).toBeNull()
    })
})

describe('overridesTasks', () =>
{
    it('is what the card says, whether or not it has dates of its own', () =>
    {
        expect(overridesTasks(card({ overridesTasks: true }))).toBe(true)
        expect(overridesTasks(card({ overridesTasks: true, timeline: deadline('2026-10-28T17:00') }))).toBe(true)
        expect(overridesTasks(card({ overridesTasks: false }))).toBe(false)
        expect(overridesTasks(card({ overridesTasks: false, timeline: deadline('2026-10-28T17:00') }))).toBe(false)
    })

    it('keeps its own dates, when the card has never said, exactly when it has some', () =>
    {
        expect(overridesTasks(card({ overridesTasks: null, timeline: deadline('2026-10-28T17:00') }))).toBe(true)
        expect(overridesTasks(card({ overridesTasks: null, timeline: null }))).toBe(false)
    })
})

describe('cardSchedule', () =>
{
    it('goes by the card\'s own timeline when the card keeps its own dates, and says it is not inherited', () =>
    {
        const own = deadline('2026-10-31T17:00')
        const schedule = cardSchedule(card({ overridesTasks: true,
                                             timeline: own,
                                             tasks: [task('task-a', deadline('2026-10-28T17:00'))] }))

        expect(schedule.timeline).toBe(own)
        expect(schedule.inherited).toBe(false)
    })

    it('goes by its tasks\' put together when the card takes theirs, and says it is inherited', () =>
    {
        const schedule = cardSchedule(card({ overridesTasks: false,
                                             timeline: deadline('2026-10-31T17:00'),
                                             tasks: [task('task-a', deadline('2026-10-28T17:00')), task('task-b', deadline('2026-10-29T17:00'))] }))

        expect(shown(schedule.timeline)).toEqual({ preferredStart: null, requiredStart: null, preferredEnd: null, requiredEnd: '10-29 17:00' })
        expect(schedule.inherited).toBe(true)
    })

    it('counts the tasks that have dates, for a card taking its tasks\' and for one keeping its own', () =>
    {
        const tasks = [task('task-a', deadline('2026-10-28T17:00')), task('task-b'), task('task-c', timeline({ startPreferenceUTC: at('2026-10-28T09:00') })), task('task-d', timeline())]

        expect(cardSchedule(card({ overridesTasks: false, tasks })).tasksWithDates).toBe(2)
        expect(cardSchedule(card({ overridesTasks: true, tasks })).tasksWithDates).toBe(2)
    })
})

describe('timelineKey', () =>
{
    it('is "none" for no timeline, and otherwise the four points in order as times, empty where a point is not set', () =>
    {
        expect(timelineKey(null)).toBe('none')
        expect(timelineKey(timeline())).toBe('|||')
        expect(timelineKey(timeline({ startPreferenceUTC: at('2026-10-28T09:30'), endDeadlineUTC: at('2026-10-30T17:00') }))).toBe('1793197800000|||1793397600000')
    })

    it('is the same for the same points, and differs when a point moves or is another point', () =>
    {
        const base = timeline({ startPreferenceUTC: at('2026-10-28T09:30'), endDeadlineUTC: at('2026-10-30T17:00') })

        expect(timelineKey({ ...base, id: 'another-row' })).toBe(timelineKey(base))
        expect(timelineKey({ ...base, endDeadlineUTC: at('2026-10-30T17:01') })).not.toBe(timelineKey(base))
        expect(timelineKey(timeline({ startDeadlineUTC: at('2026-10-28T09:30') })))
            .not.toBe(timelineKey(timeline({ startPreferenceUTC: at('2026-10-28T09:30') })))
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A date and clock time, "2026-10-28T09:30", as that local moment. */
function at(text: string): Date
{
    return dayjs(text).toDate()
}

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
function card(fields: Partial<Card> = {}): Card
{
    return {
        id: 'card-1',
        positionId: 'position-1',
        boardId: 'board-1',
        title: 'Card',
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

/** A timeline's four points as "10-28 09:30", null for a point it has not set; null for no timeline. */
function shown(result: Timeline | null)
{
    if (!result)
        return null
    return {
        preferredStart: clock(result.startPreferenceUTC),
        requiredStart: clock(result.startDeadlineUTC),
        preferredEnd: clock(result.endPreferenceUTC),
        requiredEnd: clock(result.endDeadlineUTC),
    }
}

/** A moment as "10-28 09:30" in local time. */
function clock(moment: Date | null): string | null
{
    return moment
        ? dayjs(moment).format('MM-DD HH:mm')
        : null
}
