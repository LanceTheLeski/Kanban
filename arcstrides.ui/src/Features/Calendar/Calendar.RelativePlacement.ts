/**
 * Calendar.RelativePlacement
 *
 * Putting a point among the things already on a day — "after breakfast",
 * "between breakfast and lunch" — rather than at a time.
 *
 * The day's timed things are put in order, and things that overlap are one
 * group: there is no "between" two things happening at once. The places a
 * point can go are the gaps around the groups —
 *
 *     gap 0          before the first group
 *     gap 1 … n−1    between one group and the next
 *     gap n          after the last group
 *
 * A point put in a gap still needs a time, because the API stores one instant
 * per point, so it is given one: where the group before it ends — or, before
 * the first group, so that it ends where the first begins. That time is only
 * where the point was put; the point is saved as placed (`…TimeIsRelative`)
 * and shown as "≈" wherever a time is shown. Refining it is the day's job, and
 * not built yet.
 *
 * A point too long for its gap is still put there. It overlaps what comes next,
 * and the picker draws it red and says why (`fits`, `misfitReason`).
 */

import { durationLabel } from '../Board/Timeline/Timeline.Nodes'

/** The first minute of a day a point can be at: 00:00 means no time (see isTimed). */
export const FIRST_MINUTE = 15

/** The last quarter hour a point can start at, keeping off midnight at the other end. */
export const LAST_MINUTE = 24 * 60 - 15

/** Something already on the day, in minutes from its midnight. */
export interface PlacedItem<T>
{
    item: T

    start: number

    /** `start` for an instant. */
    end: number
}

/** Items in order, overlapping ones together. */
export interface ItemGroup<T>
{
    items: PlacedItem<T>[]

    start: number

    end: number
}

/** A place between groups, for a point of a given length. */
export interface Gap
{
    /** 0 before the first group, the number of groups after the last. */
    index: number

    /** Where a point put here starts, in minutes. */
    start: number

    /** The minutes free in the gap. */
    room: number

    /** The point fits in the gap without running into the group after it. */
    fits: boolean
}

/** The day's items in order, overlapping ones grouped. */
export function groupItems<T>(items: PlacedItem<T>[]): ItemGroup<T>[]
{
    const groups: ItemGroup<T>[] = []
    for (const placed of [...items].sort((a, b) => a.start - b.start || a.end - b.end))
    {
        const last = groups.at(-1)
        // Overlapping, or two things at the same instant: one group.
        if (last && (placed.start < last.end || placed.start === last.start))
        {
            last.items.push(placed)
            last.end = Math.max(last.end, placed.end)
        }
        else
            groups.push({ items: [placed], start: placed.start, end: placed.end })
    }
    return groups
}

/**
 * The gap at `index`, for a point lasting `length` minutes. Its start is where
 * the group before ends; before the first group, it is early enough to end as
 * the first begins — a quarter hour early for an instant, so it still reads
 * as before it.
 */
export function gapAt<T>(groups: ItemGroup<T>[], index: number, length: number | null): Gap
{
    const minutes = length ?? 0
    if (index === 0)
    {
        const end = groups[0]?.start ?? LAST_MINUTE
        const earliest = end - Math.max(minutes, 15)
        return { index, start: Math.max(FIRST_MINUTE, earliest), room: end - FIRST_MINUTE, fits: earliest >= FIRST_MINUTE }
    }
    const before = groups[index - 1]
    const after = groups[index]
    const start = Math.min(before.end, LAST_MINUTE)
    const until = after?.start ?? 24 * 60
    return { index, start, room: until - before.end, fits: before.end <= LAST_MINUTE && start + minutes <= until }
}

/** Which gap a point at `start` is in: after every group that has ended by then. */
export function gapOf<T>(groups: ItemGroup<T>[], start: number): number
{
    return groups.filter(group => group.end <= start).length
}

/**
 * Whether a point at `start`, lasting `length`, fits in its gap: it starts
 * after the group before it ends, and ends before the group after it begins.
 */
export function fitsAt<T>(groups: ItemGroup<T>[], start: number, length: number | null): boolean
{
    const index = gapOf(groups, start)
    const from = index === 0
        ? FIRST_MINUTE
        : groups[index - 1].end
    const until = groups[index]?.start ?? 24 * 60
    return start >= from && start + (length ?? 0) <= until
}

/**
 * Why a point does not fit its gap, without a clock time in it: "2 h does not
 * fit between Breakfast and Lunch: there is 1 h between them…". `nameOf` names
 * a group.
 */
export function misfitReason<T>(groups: ItemGroup<T>[], index: number, length: number | null, nameOf: (group: ItemGroup<T>) => string): string
{
    const long = length
        ? durationLabel(length)
        : 'It'
    const gap = gapAt(groups, index, length)
    const room = gap.room > 0
        ? `there is ${durationLabel(gap.room)}`
        : 'there is no time'
    if (index === 0)
        return `${long} does not fit before ${nameOf(groups[0])}: ${room} before it in the day. It is put as early as the day allows, and runs into ${nameOf(groups[0])}.`
    if (index === groups.length)
        return `${long} does not fit after ${nameOf(groups[index - 1])}: ${room} left in the day after it. It starts when ${nameOf(groups[index - 1])} ends, and runs past the end of the day.`
    return `${long} does not fit between ${nameOf(groups[index - 1])} and ${nameOf(groups[index])}: ${room} between them. It starts when ${nameOf(groups[index - 1])} ends, and runs into ${nameOf(groups[index])}.`
}
