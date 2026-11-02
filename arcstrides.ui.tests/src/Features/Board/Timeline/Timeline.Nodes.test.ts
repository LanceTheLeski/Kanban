/**
 * Timeline.Nodes.test.ts
 *
 * The four points a timeline can carry: whether a point has a time or only a
 * day, how a time and a length read, which mode a stored timeline is in, and
 * what the pickers are seeded with. Times are written as clock times on
 * 28 October 2026, local (Chicago) time, which is how the UI's pickers hold them.
 *
 * Expectations are written out — "≈", "15:00–17:00", "1 h 05" — not built from
 * the module's own constants, so that a change to what a label says fails here.
 */

import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { Timeline } from '@ui/Entities/Timeline/Timeline.Types'
import {
    durationLabel,
    isTimed,
    modeOf,
    seedValues,
    spanLabel,
    type NodeId,
    type NodeValues,
} from '@ui/Features/Board/Timeline/Timeline.Nodes'

describe('isTimed', () =>
{
    it('reads local midnight as no time, only a day', () =>
    {
        expect(isTimed(dayjs('2026-10-28T00:00'))).toBe(false)
    })

    it('reads every other time as a time, 00:15 and a second past midnight among them', () =>
    {
        expect(isTimed(dayjs('2026-10-28T00:15'))).toBe(true)
        expect(isTimed(dayjs('2026-10-28T00:00:01'))).toBe(true)
        expect(isTimed(dayjs('2026-10-28T09:30'))).toBe(true)
        expect(isTimed(dayjs('2026-10-28T23:45'))).toBe(true)
    })
})

describe('durationLabel', () =>
{
    it('says minutes alone under an hour, and whole hours without minutes', () =>
    {
        expect(durationLabel(15)).toBe('15 min')
        expect(durationLabel(45)).toBe('45 min')
        expect(durationLabel(60)).toBe('1 h')
        expect(durationLabel(120)).toBe('2 h')
    })

    it('says hours and minutes together, the minutes with two digits', () =>
    {
        expect(durationLabel(90)).toBe('1 h 30')
        expect(durationLabel(150)).toBe('2 h 30')
        expect(durationLabel(65)).toBe('1 h 05')
    })
})

describe('spanLabel', () =>
{
    it('reads a time as itself, and a time with a length as from it to when it ends', () =>
    {
        expect(spanLabel(dayjs('2026-10-28T15:00'), null)).toBe('15:00')
        expect(spanLabel(dayjs('2026-10-28T15:00'), 120)).toBe('15:00–17:00')
        expect(spanLabel(dayjs('2026-10-28T09:30'), 45)).toBe('09:30–10:15')
    })

    it('puts a mark before a time that was placed in the day rather than chosen', () =>
    {
        expect(spanLabel(dayjs('2026-10-28T15:00'), null, true)).toBe('≈15:00')
        expect(spanLabel(dayjs('2026-10-28T15:00'), 120, true)).toBe('≈15:00–17:00')
        expect(spanLabel(dayjs('2026-10-28T15:00'), 120, false)).toBe('15:00–17:00')
    })

    it('reads a point with no time as how long it lasts, or nothing if it does not, and never marks it', () =>
    {
        expect(spanLabel(null, 120)).toBe('2 h')
        expect(spanLabel(null, 90)).toBe('1 h 30')
        expect(spanLabel(null, null)).toBe('')
        expect(spanLabel(null, 120, true)).toBe('2 h')
        expect(spanLabel(null, null, true)).toBe('')
    })
})

describe('modeOf', () =>
{
    it('reads no timeline at all as timeless', () =>
    {
        expect(modeOf(null)).toBe('timeless')
    })

    it('reads a timeline row whose points are all null as timeless, so a cleared timeline stays cleared', () =>
    {
        expect(modeOf(timeline({}))).toBe('timeless')
        expect(modeOf(timeline({ id: 'timeline-1', startPreferenceDurationMinutes: 60, endDeadlineTimeIsRelative: true }))).toBe('timeless')
    })

    it('reads any preferred date as a timeline, with or without a deadline beside it', () =>
    {
        expect(modeOf(timeline({ startPreferenceUTC: at('2026-10-28T09:00') }))).toBe('timeline')
        expect(modeOf(timeline({ endPreferenceUTC: at('2026-10-30T17:00') }))).toBe('timeline')
        expect(modeOf(timeline({ startPreferenceUTC: at('2026-10-28T09:00'), endDeadlineUTC: at('2026-10-31T17:00') }))).toBe('timeline')
    })

    it('reads a timeline whose only point is the required end as a deadline', () =>
    {
        expect(modeOf(timeline({ endDeadlineUTC: at('2026-10-31T17:00') }))).toBe('deadline')
        expect(modeOf(timeline({ endDeadlineUTC: at('2026-10-31T17:00'), endDeadlineDurationMinutes: 60 }))).toBe('deadline')
    })

    it('reads a required start as a timeline, with or without a required end: a deadline has nowhere to keep it', () =>
    {
        expect(modeOf(timeline({ startDeadlineUTC: at('2026-10-29T09:00') }))).toBe('timeline')
        expect(modeOf(timeline({ startDeadlineUTC: at('2026-10-29T09:00'), endDeadlineUTC: at('2026-10-31T17:00') }))).toBe('timeline')
    })
})

describe('seedValues', () =>
{
    it('gives every point no day, no time, no length and not placed when there is no timeline', () =>
    {
        expect(shown(seedValues(null))).toEqual({
            preferredStart: { date: null, time: null, duration: null, relative: false },
            requiredStart: { date: null, time: null, duration: null, relative: false },
            preferredEnd: { date: null, time: null, duration: null, relative: false },
            requiredEnd: { date: null, time: null, duration: null, relative: false },
        })
    })

    it('reads each point from its own field, splitting the instant into its day and its time', () =>
    {
        const values = seedValues(timeline({
            startPreferenceUTC: at('2026-10-26T09:00'),
            startDeadlineUTC: at('2026-10-27T10:30'),
            endPreferenceUTC: at('2026-10-29T15:15'),
            endDeadlineUTC: at('2026-10-30T17:45'),
        }))

        expect(shown(values)).toEqual({
            preferredStart: { date: '2026-10-26', time: '09:00', duration: null, relative: false },
            requiredStart: { date: '2026-10-27', time: '10:30', duration: null, relative: false },
            preferredEnd: { date: '2026-10-29', time: '15:15', duration: null, relative: false },
            requiredEnd: { date: '2026-10-30', time: '17:45', duration: null, relative: false },
        })
    })

    it('reads a point at local midnight as a day with no time, and one at 00:15 as a day with a time', () =>
    {
        const values = seedValues(timeline({
            startPreferenceUTC: at('2026-10-26T00:15'),
            endDeadlineUTC: at('2026-10-30T00:00'),
        }))

        expect(shown(values).preferredStart.time).toBe('00:15')
        expect(shown(values).requiredEnd).toEqual({ date: '2026-10-30', time: null, duration: null, relative: false })
    })

    it('keeps the length of each point, including a point with no time', () =>
    {
        const values = seedValues(timeline({
            startPreferenceUTC: at('2026-10-26T09:00'),
            startPreferenceDurationMinutes: 90,
            endDeadlineUTC: at('2026-10-30T00:00'),
            endDeadlineDurationMinutes: 120,
        }))

        expect(shown(values).preferredStart.duration).toBe(90)
        expect(shown(values).requiredEnd).toEqual({ date: '2026-10-30', time: null, duration: 120, relative: false })
    })

    it('keeps whether a timed point was placed in the day, and reads a point with no time as not placed', () =>
    {
        const values = seedValues(timeline({
            startPreferenceUTC: at('2026-10-26T09:00'),
            startPreferenceTimeIsRelative: true,
            endPreferenceUTC: at('2026-10-29T15:00'),
            endPreferenceTimeIsRelative: false,
            endDeadlineUTC: at('2026-10-30T00:00'),
            endDeadlineTimeIsRelative: true,
        }))

        expect(shown(values).preferredStart.relative).toBe(true)
        expect(shown(values).preferredEnd.relative).toBe(false)
        expect(shown(values).requiredEnd.relative).toBe(false)
    })

    it('leaves a point with no date empty, and does not read the length stored beside it', () =>
    {
        const values = seedValues(timeline({
            endDeadlineUTC: at('2026-10-30T17:00'),
            startPreferenceDurationMinutes: 60,
            startPreferenceTimeIsRelative: true,
        }))

        expect(shown(values).preferredStart).toEqual({ date: null, time: null, duration: null, relative: false })
        expect(shown(values).requiredEnd.date).toBe('2026-10-30')
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A timeline with the points it is given, and everything else empty. */
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

/** "2026-10-28T09:30" as that local time. */
function at(local: string): Date
{
    return dayjs(local).toDate()
}

/** The four points as they read: each day as "2026-10-28" and each time as "09:30". */
function shown(values: NodeValues): Record<NodeId, { date: string | null; time: string | null; duration: number | null; relative: boolean }>
{
    const read = (id: NodeId) =>
    ({
        date: values[id].date?.format('YYYY-MM-DD') ?? null,
        time: values[id].time?.format('HH:mm') ?? null,
        duration: values[id].duration,
        relative: values[id].relative,
    })

    return {
        preferredStart: read('preferredStart'),
        requiredStart: read('requiredStart'),
        preferredEnd: read('preferredEnd'),
        requiredEnd: read('requiredEnd'),
    }
}
