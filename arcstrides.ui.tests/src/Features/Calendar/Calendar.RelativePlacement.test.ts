/**
 * Calendar.RelativePlacement.test.ts
 *
 * Putting a point among the things already on a day: where each place is,
 * what time a point put there is given, whether it fits, and what is said when
 * it does not. Times are written as clock times and turned into minutes below.
 *
 * Expectations are written out — "12:00", not the module's NOON — so that a
 * change to the rule fails here rather than moving the test along with it.
 */

import { describe, expect, it } from 'vitest'
import {
    fitsAt,
    gapAt,
    gapOf,
    inOrder,
    misfitReason,
    type PlacedItem,
} from '@ui/Features/Calendar/Calendar.RelativePlacement'

describe('inOrder', () =>
{
    it('puts the things by when they start, then by when they end', () =>
    {
        const ordered = inOrder([thing('Lunch', '12:00', '13:00'), thing('Breakfast', '08:00', '09:00'), thing('Call', '08:00', '08:30')])

        expect(ordered.map(placed => placed.item)).toEqual(['Call', 'Breakfast', 'Lunch'])
    })

    it('keeps two things at the very same moment in the order given', () =>
    {
        expect(inOrder([thing('A', '09:00'), thing('B', '09:00')]).map(placed => placed.item)).toEqual(['A', 'B'])
        expect(inOrder([thing('B', '09:00'), thing('A', '09:00')]).map(placed => placed.item)).toEqual(['B', 'A'])
    })
})

describe('gapAt', () =>
{
    it('puts a point on a day with nothing timed at noon', () =>
    {
        expect(gapAt([], 0, null).start).toBe(minutes('12:00'))
        expect(gapAt([], 0, 60).start).toBe(minutes('12:00'))
    })

    it('starts a point too long for the afternoon early enough to end by midnight', () =>
    {
        const gap = gapAt([], 0, 14 * 60)

        expect(gap.start).toBe(minutes('10:00'))
        expect(gap.fits).toBe(true)
    })

    it('cannot fit a point as long as the day', () =>
    {
        const gap = gapAt([], 0, 24 * 60)

        expect(gap.start).toBe(minutes('00:15'))
        expect(gap.fits).toBe(false)
    })

    it('ends a point put before the first thing where that thing begins', () =>
    {
        const gap = gapAt([thing('Breakfast', '08:00', '09:00')], 0, 30)

        expect(gap.start).toBe(minutes('07:30'))
        expect(gap.fits).toBe(true)
    })

    it('gives an instant put before the first thing a quarter of an hour before it', () =>
    {
        expect(gapAt([thing('Breakfast', '08:00', '09:00')], 0, null).start).toBe(minutes('07:45'))
    })

    it('starts a point too long for the time before the first thing as early as the day allows, and says it does not fit', () =>
    {
        const gap = gapAt([thing('Breakfast', '01:00', '02:00')], 0, 120)

        expect(gap.start).toBe(minutes('00:15'))
        expect(gap.fits).toBe(false)
    })

    it('starts a point between two things when the first of them ends', () =>
    {
        const gap = gapAt([thing('Breakfast', '08:00', '09:00'), thing('Lunch', '12:00', '13:00')], 1, 60)

        expect(gap.start).toBe(minutes('09:00'))
        expect(gap.room).toBe(180)
        expect(gap.fits).toBe(true)
    })

    it('puts a point between two things that overlap where the later begins, so it is still between them', () =>
    {
        const gap = gapAt([thing('Meeting', '09:00', '11:00'), thing('Call', '10:00', '10:30')], 1, null)

        expect(gap.start).toBe(minutes('10:00'))
        expect(gap.room).toBeLessThan(0)
    })

    it('starts a point after the last thing when that ends, and no later than 23:45', () =>
    {
        expect(gapAt([thing('Dinner', '18:00', '19:00')], 1, null).start).toBe(minutes('19:00'))
        expect(gapAt([thing('Late', '22:00', '23:59')], 1, null).start).toBe(minutes('23:45'))
    })

    it('counts the room after the last thing to midnight', () =>
    {
        expect(gapAt([thing('Dinner', '18:00', '19:00')], 1, null).room).toBe(5 * 60)
    })
})

describe('gapOf', () =>
{
    it('finds the place a point is in from its time', () =>
    {
        const day = [thing('Breakfast', '08:00', '09:00'), thing('Lunch', '12:00', '13:00')]

        expect(gapOf(day, minutes('07:00'))).toBe(0)
        expect(gapOf(day, minutes('10:00'))).toBe(1)
        expect(gapOf(day, minutes('14:00'))).toBe(2)
    })

    it('puts a point at the same moment as an instant after it', () =>
    {
        expect(gapOf([thing('Standup', '09:00')], minutes('09:00'))).toBe(1)
    })

    it('puts a point at the moment a span starts before it', () =>
    {
        expect(gapOf([thing('Meeting', '09:00', '10:00')], minutes('09:00'))).toBe(0)
    })

    it('reads back the place a point was put in', () =>
    {
        const day = [thing('Breakfast', '08:00', '09:00'), thing('Lunch', '12:00', '13:00'), thing('Dinner', '18:00', '19:00')]

        for (let index = 0; index <= day.length; index++)
            expect(gapOf(day, gapAt(day, index, null).start)).toBe(index)
    })
})

describe('fitsAt', () =>
{
    const day = [thing('Breakfast', '08:00', '09:00')]

    it('fits a point in free time', () =>
    {
        expect(fitsAt(day, minutes('10:00'), 60)).toBe(true)
    })

    it('does not fit a point that runs into something', () =>
    {
        expect(fitsAt(day, minutes('07:30'), 60)).toBe(false)
    })

    it('fits a point that ends as the next thing begins, or begins as the last one ends', () =>
    {
        expect(fitsAt(day, minutes('07:00'), 60)).toBe(true)
        expect(fitsAt(day, minutes('09:00'), 30)).toBe(true)
    })

    it('does not fit an instant inside a span, but fits one at its start or its end', () =>
    {
        expect(fitsAt(day, minutes('08:30'), null)).toBe(false)
        expect(fitsAt(day, minutes('08:00'), null)).toBe(true)
        expect(fitsAt(day, minutes('09:00'), null)).toBe(true)
    })

    it('never counts two instants as overlapping', () =>
    {
        expect(fitsAt([thing('Standup', '09:00')], minutes('09:00'), null)).toBe(true)
    })

    it('does not fit a point that runs past midnight', () =>
    {
        expect(fitsAt([], minutes('22:00'), 120)).toBe(true)
        expect(fitsAt([], minutes('23:00'), 120)).toBe(false)
    })
})

describe('misfitReason', () =>
{
    it('says a point is longer than a day with nothing on it', () =>
    {
        expect(misfitReason([], 0, 24 * 60, named)).toBe('24 h is longer than the day, so it runs past its end.')
    })

    it('says how much time there is before the first thing', () =>
    {
        expect(misfitReason([thing('Breakfast', '01:00', '02:00')], 0, 120, named))
            .toBe('2 h does not fit before Breakfast: there is 45 min before it in the day. It is put as early as the day allows, and runs into Breakfast.')
    })

    it('says how much time there is between two things, and what the point runs into', () =>
    {
        expect(misfitReason([thing('Breakfast', '08:00', '09:00'), thing('Lunch', '10:00', '11:00')], 1, 120, named))
            .toBe('2 h does not fit between Breakfast and Lunch: there is 1 h between them. It starts when Breakfast ends, and runs into Lunch.')
    })

    it('says two overlapping things have no time between them', () =>
    {
        expect(misfitReason([thing('Meeting', '09:00', '11:00'), thing('Call', '10:00', '10:30')], 1, null, named))
            .toBe('Meeting and Call overlap, so there is no time between them. It is put where Call starts, during Meeting.')
    })

    it('says what a point after the last thing runs into', () =>
    {
        expect(misfitReason([thing('Long', '08:00', '20:00'), thing('Short', '09:00', '10:00')], 2, 60, named))
            .toBe('1 h does not fit after Short: it starts when Short ends, and runs into Long.')
    })

    it('says a point after the last thing runs past the end of the day', () =>
    {
        expect(misfitReason([thing('Dinner', '18:00', '23:00')], 1, 120, named))
            .toBe('2 h does not fit after Dinner: there is 1 h left in the day after it. It starts when Dinner ends, and runs past the end of the day.')
    })

    it('never gives a clock time: the order is the point, not the hours', () =>
    {
        const reasons =
        [
            misfitReason([thing('Breakfast', '01:00', '02:00')], 0, 120, named),
            misfitReason([thing('Breakfast', '08:00', '09:00'), thing('Lunch', '10:00', '11:00')], 1, 120, named),
            misfitReason([thing('Dinner', '18:00', '23:00')], 1, 120, named),
        ]

        for (const reason of reasons)
            expect(reason).not.toMatch(/\d:\d\d/)
    })
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Something on the day, named, from one clock time to another; an instant without `to`. */
function thing(name: string, from: string, to: string = from): PlacedItem<string>
{
    return { item: name, start: minutes(from), end: minutes(to) }
}

/** "09:30" as minutes from midnight. */
function minutes(clock: string): number
{
    const [hours, rest] = clock.split(':').map(Number)
    return hours * 60 + rest
}

/** A thing's name, for misfitReason: here each thing is only its name. */
function named(name: string): string
{
    return name
}
