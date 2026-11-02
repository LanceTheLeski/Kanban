/**
 * Timeline.Draft.test.ts
 *
 * What the timeline panel collects and how it becomes what the API stores: the
 * four points folded from a day and a time, a mode that keeps only its own
 * points, a timeline read into a draft and back, the patch that writes a
 * timeline, and whether it is created or patched. Days and times are local
 * (Chicago) time on 28 October 2026, as the pickers hold them.
 *
 * The API module is never called: it is replaced, and each test says what would
 * have been sent. Expectations are written out — the paths, the numbers 1 and 2
 * — not built from the module's own constants, so that a change to what is
 * sent fails here rather than moving the test along with it.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import type { Timeline } from '@ui/Entities/Timeline/Timeline.Types'
import { createTimeline, updateTimeline } from '@ui/Features/Board/Board.APIs'
import {
    TIMELINE_PARENT_CARD,
    TIMELINE_PARENT_TASK,
    draftFromTimeline,
    draftMatches,
    draftOf,
    draftToTimelineDates,
    hasTimeline,
    saveTimeline,
    timelineOperations,
    type TimelineDates,
    type TimelineDraft,
} from '@ui/Features/Board/Timeline/Timeline.Draft'
import type { NodeValues } from '@ui/Features/Board/Timeline/Timeline.Nodes'

vi.mock('@ui/Features/Board/Board.APIs', () =>
({
    createTimeline: vi.fn(),
    updateTimeline: vi.fn(),
}))

beforeEach(() =>
{
    vi.resetAllMocks()
})

describe('draftToTimelineDates', () =>
{
    it('puts each point in its own field: preferred in the preference fields, required in the deadline fields', () =>
    {
        const dates = draftToTimelineDates(draft({
            preferredStart: day('2026-10-26'),
            requiredStart: day('2026-10-27'),
            preferredEnd: day('2026-10-29'),
            requiredEnd: day('2026-10-30'),
        }))

        expect(dates.startPreferenceUTC).toEqual(at('2026-10-26T00:00'))
        expect(dates.startDeadlineUTC).toEqual(at('2026-10-27T00:00'))
        expect(dates.endPreferenceUTC).toEqual(at('2026-10-29T00:00'))
        expect(dates.endDeadlineUTC).toEqual(at('2026-10-30T00:00'))
    })

    it("folds a day and a time into one instant, and keeps a day with no time at that day's midnight", () =>
    {
        const dates = draftToTimelineDates(draft({
            preferredStart: at('2026-10-26T14:45:30'),
            preferredStartTime: '09:15',
            requiredEnd: day('2026-10-30'),
            requiredEndTime: null,
        }))

        expect(dates.startPreferenceUTC).toEqual(at('2026-10-26T09:15'))
        expect(dates.endDeadlineUTC).toEqual(at('2026-10-30T00:00'))
    })

    it('keeps the length of a point that has a day, and drops a length that has no point to last from', () =>
    {
        const dates = draftToTimelineDates(draft({
            preferredStart: day('2026-10-26'),
            preferredStartTime: '09:00',
            preferredStartDuration: 90,
            requiredStart: day('2026-10-27'),
            requiredStartDuration: 30,
            preferredEnd: null,
            preferredEndDuration: 45,
            requiredEnd: null,
            requiredEndDuration: 120,
        }))

        expect(dates.startPreferenceDurationMinutes).toBe(90)
        expect(dates.startDeadlineDurationMinutes).toBe(30)
        expect(dates.endPreferenceDurationMinutes).toBeNull()
        expect(dates.endDeadlineDurationMinutes).toBeNull()
    })

    it('keeps no relative flag on a point with no time, since nothing was placed', () =>
    {
        const dates = draftToTimelineDates(draft({
            preferredStart: day('2026-10-26'),
            preferredStartTime: null,
            preferredStartRelative: true,
            requiredEnd: day('2026-10-30'),
            requiredEndTime: '17:00',
            requiredEndRelative: true,
        }))

        expect(dates.startPreferenceTimeIsRelative).toBe(false)
        expect(dates.endDeadlineTimeIsRelative).toBe(true)
    })
})

describe('draftOf', () =>
{
    it('reports every point in Timeline mode, as a day, a time written "HH:mm", a length and whether it was placed', () =>
    {
        expect(draftOf(values(), 'timeline')).toEqual({
            mode: 'timeline',
            preferredStart: at('2026-10-26T00:00'),
            preferredStartTime: '09:00',
            preferredStartDuration: 90,
            preferredStartRelative: true,
            requiredStart: at('2026-10-27T00:00'),
            requiredStartTime: null,
            requiredStartDuration: 30,
            requiredStartRelative: false,
            preferredEnd: at('2026-10-29T00:00'),
            preferredEndTime: '15:15',
            preferredEndDuration: null,
            preferredEndRelative: false,
            requiredEnd: at('2026-10-30T00:00'),
            requiredEndTime: '17:45',
            requiredEndDuration: 120,
            requiredEndRelative: true,
        })
    })

    it('keeps only the required end in Deadline mode, whatever the other points were last set to', () =>
    {
        expect(draftOf(values(), 'deadline')).toEqual({
            mode: 'deadline',
            preferredStart: null,
            preferredStartTime: null,
            preferredStartDuration: null,
            preferredStartRelative: false,
            requiredStart: null,
            requiredStartTime: null,
            requiredStartDuration: null,
            requiredStartRelative: false,
            preferredEnd: null,
            preferredEndTime: null,
            preferredEndDuration: null,
            preferredEndRelative: false,
            requiredEnd: at('2026-10-30T00:00'),
            requiredEndTime: '17:45',
            requiredEndDuration: 120,
            requiredEndRelative: true,
        })
    })

    it('reports nothing in Timeless mode, so that switching to it clears the schedule rather than hiding it', () =>
    {
        const timeless = draftOf(values(), 'timeless')

        expect(timeless).toEqual(draft({ mode: 'timeless' }))
        expect(draftToTimelineDates(timeless)).toEqual({
            startPreferenceUTC: null,
            startDeadlineUTC: null,
            endPreferenceUTC: null,
            endDeadlineUTC: null,
            startPreferenceDurationMinutes: null,
            startDeadlineDurationMinutes: null,
            endPreferenceDurationMinutes: null,
            endDeadlineDurationMinutes: null,
            startPreferenceTimeIsRelative: false,
            startDeadlineTimeIsRelative: false,
            endPreferenceTimeIsRelative: false,
            endDeadlineTimeIsRelative: false,
        })
    })
})

describe('draftFromTimeline', () =>
{
    it('recovers the mode from the dates: preferred dates a timeline, a lone deadline a deadline', () =>
    {
        expect(draftFromTimeline(timeline({ startPreferenceUTC: at('2026-10-26T09:00') })).mode).toBe('timeline')
        expect(draftFromTimeline(timeline({ endDeadlineUTC: at('2026-10-30T17:00') })).mode).toBe('deadline')
        expect(draftFromTimeline(timeline({ id: 'timeline-1' })).mode).toBe('timeless')
    })

    it('reads a timeline into a draft that gives the same dates back', () =>
    {
        const stored = timeline({
            startPreferenceUTC: at('2026-10-26T09:00'),
            startPreferenceDurationMinutes: 90,
            startPreferenceTimeIsRelative: true,
            startDeadlineUTC: at('2026-10-27T00:00'),
            startDeadlineDurationMinutes: 30,
            endPreferenceUTC: at('2026-10-29T15:15'),
            endDeadlineUTC: at('2026-10-30T17:45'),
            endDeadlineDurationMinutes: 120,
        })

        expect(draftMatches(draftFromTimeline(stored), stored)).toBe(true)
        expect(draftToTimelineDates(draftFromTimeline(stored))).toEqual({
            startPreferenceUTC: at('2026-10-26T09:00'),
            startDeadlineUTC: at('2026-10-27T00:00'),
            endPreferenceUTC: at('2026-10-29T15:15'),
            endDeadlineUTC: at('2026-10-30T17:45'),
            startPreferenceDurationMinutes: 90,
            startDeadlineDurationMinutes: 30,
            endPreferenceDurationMinutes: null,
            endDeadlineDurationMinutes: 120,
            startPreferenceTimeIsRelative: true,
            startDeadlineTimeIsRelative: false,
            endPreferenceTimeIsRelative: false,
            endDeadlineTimeIsRelative: false,
        })
    })

    it('keeps a required start that has no preferred dates beside it, so saving it again clears nothing', () =>
    {
        const stored = timeline({ id: 'timeline-1', startDeadlineUTC: at('2026-10-27T09:00'), endDeadlineUTC: at('2026-10-30T17:00') })
        const read = draftFromTimeline(stored)

        expect(read.mode).toBe('timeline')
        expect(draftMatches(read, stored)).toBe(true)
        expect(draftToTimelineDates(read).startDeadlineUTC).toEqual(at('2026-10-27T09:00'))
    })

    it('reads a deadline, a timeline with every point cleared and no timeline at all back as what they were', () =>
    {
        const deadline = timeline({ endDeadlineUTC: at('2026-10-30T00:00'), endDeadlineDurationMinutes: 120 })
        const cleared = timeline({ id: 'timeline-1' })

        expect(draftFromTimeline(null)).toEqual(draft({ mode: 'timeless' }))
        expect(draftMatches(draftFromTimeline(deadline), deadline)).toBe(true)
        expect(draftMatches(draftFromTimeline(cleared), cleared)).toBe(true)
        expect(draftMatches(draftFromTimeline(null), null)).toBe(true)
    })
})

describe('hasTimeline', () =>
{
    it('says a Timeline or a Deadline draft describes a real timeline, and a Timeless draft or none does not', () =>
    {
        expect(hasTimeline(draft({ mode: 'timeline' }))).toBe(true)
        expect(hasTimeline(draft({ mode: 'deadline' }))).toBe(true)
        expect(hasTimeline(draft({ mode: 'timeless' }))).toBe(false)
        expect(hasTimeline(null)).toBe(false)
    })
})

describe('draftMatches', () =>
{
    const stored = timeline({
        id: 'timeline-1',
        startPreferenceUTC: at('2026-10-26T09:00'),
        startPreferenceDurationMinutes: 60,
        endDeadlineUTC: at('2026-10-30T17:00'),
        endDeadlineTimeIsRelative: true,
    })

    it('matches a draft that would write what the timeline holds, even changed and changed back', () =>
    {
        const read = draftFromTimeline(stored)
        const changed = { ...read, preferredStartTime: '10:00' }
        const changedBack = { ...changed, preferredStartTime: '09:00' }

        expect(draftMatches(read, stored)).toBe(true)
        expect(draftMatches(changed, stored)).toBe(false)
        expect(draftMatches(changedBack, stored)).toBe(true)
    })

    it('does not match a draft with a point moved, taken off, or added', () =>
    {
        const read = draftFromTimeline(stored)

        expect(draftMatches({ ...read, preferredStart: day('2026-10-27') }, stored)).toBe(false)
        expect(draftMatches({ ...read, preferredStart: null }, stored)).toBe(false)
        expect(draftMatches({ ...read, requiredStart: day('2026-10-27') }, stored)).toBe(false)
    })

    it('does not match a draft with a point made longer, or an instant', () =>
    {
        const read = draftFromTimeline(stored)

        expect(draftMatches({ ...read, preferredStartDuration: 90 }, stored)).toBe(false)
        expect(draftMatches({ ...read, preferredStartDuration: null }, stored)).toBe(false)
    })

    it('does not match a draft with a point put in the day\'s order, or chosen instead', () =>
    {
        const read = draftFromTimeline(stored)

        expect(draftMatches({ ...read, preferredStartRelative: true }, stored)).toBe(false)
        expect(draftMatches({ ...read, requiredEndRelative: false }, stored)).toBe(false)
    })

    it('matches a Timeless draft only against no timeline, or a cleared one, since saving it would clear any points', () =>
    {
        expect(draftMatches(draft({ mode: 'timeless' }), stored)).toBe(false)
        expect(draftMatches(draft({ mode: 'timeless' }), null)).toBe(true)
        expect(draftMatches(draft({ mode: 'timeless' }), timeline({ id: 'timeline-1' }))).toBe(true)
        expect(draftMatches(draft({ mode: 'deadline', requiredEnd: day('2026-10-30') }), null)).toBe(false)
    })
})

describe('timelineOperations', () =>
{
    it('replaces all twelve fields, each at its own path', () =>
    {
        const operations = timelineOperations(dates({
            startPreferenceUTC: new Date('2026-10-26T14:00:00.000Z'),
            startDeadlineUTC: new Date('2026-10-27T05:00:00.000Z'),
            endPreferenceUTC: new Date('2026-10-29T20:15:00.000Z'),
            endDeadlineUTC: new Date('2026-10-30T22:45:00.000Z'),
            startPreferenceDurationMinutes: 90,
            startDeadlineDurationMinutes: 30,
            endPreferenceDurationMinutes: 45,
            endDeadlineDurationMinutes: 120,
            startPreferenceTimeIsRelative: true,
            startDeadlineTimeIsRelative: false,
            endPreferenceTimeIsRelative: false,
            endDeadlineTimeIsRelative: true,
        }))

        expect(operations).toEqual([
            { op: 'replace', path: '/startPreferenceUTC', value: '2026-10-26T14:00:00.000Z' },
            { op: 'replace', path: '/startDeadlineUTC', value: '2026-10-27T05:00:00.000Z' },
            { op: 'replace', path: '/endPreferenceUTC', value: '2026-10-29T20:15:00.000Z' },
            { op: 'replace', path: '/endDeadlineUTC', value: '2026-10-30T22:45:00.000Z' },
            { op: 'replace', path: '/startPreferenceDurationMinutes', value: 90 },
            { op: 'replace', path: '/startDeadlineDurationMinutes', value: 30 },
            { op: 'replace', path: '/endPreferenceDurationMinutes', value: 45 },
            { op: 'replace', path: '/endDeadlineDurationMinutes', value: 120 },
            { op: 'replace', path: '/startPreferenceTimeIsRelative', value: true },
            { op: 'replace', path: '/startDeadlineTimeIsRelative', value: false },
            { op: 'replace', path: '/endPreferenceTimeIsRelative', value: false },
            { op: 'replace', path: '/endDeadlineTimeIsRelative', value: true },
        ])
    })

    it('sends a point taken off as null, so that the patch clears it', () =>
    {
        const operations = timelineOperations(dates({}))

        expect(operations).toHaveLength(12)
        expect(operations.map(operation => operation.op)).toEqual(Array(12).fill('replace'))
        expect(operations.slice(0, 8).map(operation => operation.value)).toEqual(Array(8).fill(null))
        expect(operations.slice(8).map(operation => operation.value)).toEqual(Array(4).fill(false))
    })
})

describe('TIMELINE_PARENT_CARD and TIMELINE_PARENT_TASK', () =>
{
    it('are the numbers the server reads as the kind of parent: 1 a card, 2 a task', () =>
    {
        expect(TIMELINE_PARENT_CARD).toBe(1)
        expect(TIMELINE_PARENT_TASK).toBe(2)
    })
})

describe('saveTimeline', () =>
{
    it('creates a timeline when the parent has none yet, with the parent, its kind and every point', async () =>
    {
        const made = timeline({ id: 'timeline-9', endDeadlineUTC: at('2026-10-30T17:00') })
        vi.mocked(createTimeline).mockResolvedValue(made)

        const saved = await saveTimeline('board-1', { id: 'task-1', kind: 2 }, null, draftOf(values(), 'deadline'))

        expect(createTimeline).toHaveBeenCalledOnce()
        expect(createTimeline).toHaveBeenCalledWith('board-1', {
            parentId: 'task-1',
            timelineTypeId: 2,
            startPreferenceUTC: null,
            startDeadlineUTC: null,
            endPreferenceUTC: null,
            endDeadlineUTC: at('2026-10-30T17:45'),
            startPreferenceDurationMinutes: null,
            startDeadlineDurationMinutes: null,
            endPreferenceDurationMinutes: null,
            endDeadlineDurationMinutes: 120,
            startPreferenceTimeIsRelative: false,
            startDeadlineTimeIsRelative: false,
            endPreferenceTimeIsRelative: false,
            endDeadlineTimeIsRelative: true,
        })
        expect(updateTimeline).not.toHaveBeenCalled()
        expect(saved).toBe(made)
    })

    it("sends the parent's kind as the timeline's type, not the mode: a Timeline on a card is a card's", async () =>
    {
        vi.mocked(createTimeline).mockResolvedValue(null)

        await saveTimeline('board-1', { id: 'card-1', kind: 1 }, null, draftOf(values(), 'timeline'))

        expect(vi.mocked(createTimeline).mock.calls[0][1]).toMatchObject({ parentId: 'card-1', timelineTypeId: 1 })
    })

    it('creates nothing for a Timeless draft when there is no timeline to clear', async () =>
    {
        const saved = await saveTimeline('board-1', { id: 'task-1', kind: 2 }, null, draftOf(values(), 'timeless'))

        expect(saved).toBeNull()
        expect(createTimeline).not.toHaveBeenCalled()
        expect(updateTimeline).not.toHaveBeenCalled()
    })

    it('patches a timeline that already exists in place, with every field, and returns it as it now stands', async () =>
    {
        const existing = timeline({ id: 'timeline-1', startDependencyTagGroupId: 'group-1', endDeadlineUTC: at('2026-10-28T09:00') })
        vi.mocked(updateTimeline).mockResolvedValue(undefined)

        const saved = await saveTimeline('board-1', { id: 'task-1', kind: 2 }, existing, draftOf(values(), 'deadline'))

        expect(createTimeline).not.toHaveBeenCalled()
        expect(updateTimeline).toHaveBeenCalledOnce()
        expect(updateTimeline).toHaveBeenCalledWith('board-1', 'timeline-1', [
            { op: 'replace', path: '/startPreferenceUTC', value: null },
            { op: 'replace', path: '/startDeadlineUTC', value: null },
            { op: 'replace', path: '/endPreferenceUTC', value: null },
            { op: 'replace', path: '/endDeadlineUTC', value: '2026-10-30T22:45:00.000Z' },
            { op: 'replace', path: '/startPreferenceDurationMinutes', value: null },
            { op: 'replace', path: '/startDeadlineDurationMinutes', value: null },
            { op: 'replace', path: '/endPreferenceDurationMinutes', value: null },
            { op: 'replace', path: '/endDeadlineDurationMinutes', value: 120 },
            { op: 'replace', path: '/startPreferenceTimeIsRelative', value: false },
            { op: 'replace', path: '/startDeadlineTimeIsRelative', value: false },
            { op: 'replace', path: '/endPreferenceTimeIsRelative', value: false },
            { op: 'replace', path: '/endDeadlineTimeIsRelative', value: true },
        ])
        expect(saved).toEqual(timeline({
            id: 'timeline-1',
            startDependencyTagGroupId: 'group-1',
            endDeadlineUTC: at('2026-10-30T17:45'),
            endDeadlineDurationMinutes: 120,
            endDeadlineTimeIsRelative: true,
        }))
    })

    it('patches Timeless over a timeline as nulls, so that it really clears, and returns it with no points', async () =>
    {
        const existing = timeline({
            id: 'timeline-1',
            startPreferenceUTC: at('2026-10-26T09:00'),
            startPreferenceDurationMinutes: 60,
            endDeadlineUTC: at('2026-10-30T17:00'),
            endDeadlineTimeIsRelative: true,
        })
        vi.mocked(updateTimeline).mockResolvedValue(undefined)

        const saved = await saveTimeline('board-1', { id: 'task-1', kind: 2 }, existing, draftOf(values(), 'timeless'))

        expect(createTimeline).not.toHaveBeenCalled()
        expect(updateTimeline).toHaveBeenCalledWith('board-1', 'timeline-1', [
            { op: 'replace', path: '/startPreferenceUTC', value: null },
            { op: 'replace', path: '/startDeadlineUTC', value: null },
            { op: 'replace', path: '/endPreferenceUTC', value: null },
            { op: 'replace', path: '/endDeadlineUTC', value: null },
            { op: 'replace', path: '/startPreferenceDurationMinutes', value: null },
            { op: 'replace', path: '/startDeadlineDurationMinutes', value: null },
            { op: 'replace', path: '/endPreferenceDurationMinutes', value: null },
            { op: 'replace', path: '/endDeadlineDurationMinutes', value: null },
            { op: 'replace', path: '/startPreferenceTimeIsRelative', value: false },
            { op: 'replace', path: '/startDeadlineTimeIsRelative', value: false },
            { op: 'replace', path: '/endPreferenceTimeIsRelative', value: false },
            { op: 'replace', path: '/endDeadlineTimeIsRelative', value: false },
        ])
        expect(saved).toEqual(timeline({ id: 'timeline-1' }))
    })

    it('creates a timeline whose copy has no ID yet, such as dates a card took from its tasks, rather than patching nothing', async () =>
    {
        const inherited = timeline({ id: null, endDeadlineUTC: at('2026-10-30T17:00') })
        vi.mocked(createTimeline).mockResolvedValue(null)

        await saveTimeline('board-1', { id: 'card-1', kind: 1 }, inherited, draftFromTimeline(inherited))

        expect(updateTimeline).not.toHaveBeenCalled()
        expect(createTimeline).toHaveBeenCalledOnce()
        expect(vi.mocked(createTimeline).mock.calls[0][1]).toMatchObject({ parentId: 'card-1', timelineTypeId: 1, endDeadlineUTC: at('2026-10-30T17:00') })
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A draft with the fields it is given, and everything else empty. */
function draft(fields: Partial<TimelineDraft>): TimelineDraft
{
    return {
        mode: 'timeline',
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
        ...fields,
    }
}

/** The day "2026-10-28" as a date picker holds it: that local midnight. */
function day(date: string): Date
{
    return at(`${date}T00:00`)
}

/** "2026-10-28T09:30" as that local time. */
function at(local: string): Date
{
    return dayjs(local).toDate()
}

/**
 * All four points set, each differently, as the pickers hold them: a placed
 * 09:00 lasting 90 minutes, a day with no time lasting 30, a 15:15 that is an
 * instant, and a placed 17:45 lasting 2 h.
 */
function values(): NodeValues
{
    return {
        preferredStart: { date: dayjs('2026-10-26T00:00'), time: dayjs('2026-10-26T09:00'), duration: 90, relative: true },
        requiredStart: { date: dayjs('2026-10-27T00:00'), time: null, duration: 30, relative: false },
        preferredEnd: { date: dayjs('2026-10-29T00:00'), time: dayjs('2026-10-29T15:15'), duration: null, relative: false },
        requiredEnd: { date: dayjs('2026-10-30T00:00'), time: dayjs('2026-10-30T17:45'), duration: 120, relative: true },
    }
}

/** A stored timeline with the fields it is given, and everything else empty. */
function timeline(fields: Partial<Timeline>): Timeline
{
    return {
        id: null,
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
        ...fields,
    }
}

/** Dates to write, with the fields they are given, and everything else cleared. */
function dates(fields: Partial<TimelineDates>): TimelineDates
{
    return {
        startPreferenceUTC: null,
        startDeadlineUTC: null,
        endPreferenceUTC: null,
        endDeadlineUTC: null,
        startPreferenceDurationMinutes: null,
        startDeadlineDurationMinutes: null,
        endPreferenceDurationMinutes: null,
        endDeadlineDurationMinutes: null,
        startPreferenceTimeIsRelative: false,
        startDeadlineTimeIsRelative: false,
        endPreferenceTimeIsRelative: false,
        endDeadlineTimeIsRelative: false,
        ...fields,
    }
}
