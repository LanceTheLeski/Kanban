/**
 * Calendar.RelativePlacement
 *
 * Putting a point among the things already on a day — "after breakfast",
 * "between breakfast and lunch" — rather than at a time.
 *
 * The day's timed things are put in order, and there is a place before the
 * first, between every two, and after the last —
 *
 *     gap 0          before the first
 *     gap 1 … n−1    between one and the next
 *     gap n          after the last
 *
 * — between any two, even two at the same moment or two that overlap. Things
 * that overlap used to be one block with no place between them, and a point put
 * after something takes that thing's end as its time, so a point placed after
 * another merged with it and nothing could be put between them again.
 *
 * A point put in a gap still needs a time, because the API stores one instant
 * per point, so it is given one: where the thing before it ends — or, before the
 * first, so that it ends where the first begins. Where the thing before runs
 * past the start of the one after, it is the start of the one after, so the
 * point is still between them. That time is only where the point was put; the
 * point is saved as placed (`…TimeIsRelative`) and shown as "≈" wherever a time
 * is shown. Refining it is the day's job, and not built yet.
 *
 * A day with nothing timed has one place, and a point put there is at noon —
 * the middle of the day, as good a guess as any — or early enough to end by
 * midnight, for one lasting longer than the afternoon.
 *
 * A point that overlaps anything is still put there, drawn red with the reason
 * (`fitsAt`, `misfitReason`): too long for its gap, or put between two things
 * with no time between them.
 *
 * Two things at the very same moment are a tie only the order on screen breaks;
 * a point placed between them is at that moment too. On reopening, a point is
 * shown after every thing that starts before it, or at its moment and ends
 * there (`gapOf`) — which is between them unless both are instants.
 */

import { durationLabel } from '../Board/Timeline/Timeline.Nodes'

/** The first minute of a day a point can be at: 00:00 means no time (see isTimed). */
export const FIRST_MINUTE = 15

/** The last quarter hour a point can start at, keeping off midnight at the other end. */
export const LAST_MINUTE = 24 * 60 - 15

/** Where a point goes on a day with nothing timed to put it among. */
export const NOON = 12 * 60

/** Something already on the day, in minutes from its midnight. */
export interface PlacedItem<T>
{
    item: T

    start: number

    /** `start` for an instant. */
    end: number
}

/** A place between two things, for a point of a given length. */
export interface Gap
{
    /** 0 before the first thing, the number of things after the last. */
    index: number

    /** Where a point put here starts, in minutes. */
    start: number

    /** The minutes free between the thing before and the thing after; less than 0 where they overlap. */
    room: number

    /** The point overlaps nothing there. */
    fits: boolean
}

/** The day's things in order: by start, then by end, and otherwise as given. */
export function inOrder<T>(items: PlacedItem<T>[]): PlacedItem<T>[]
{
    return [...items].sort((a, b) => a.start - b.start || a.end - b.end)
}

/**
 * The gap at `index` among things `inOrder`, for a point lasting `length`
 * minutes — see the header for where it starts.
 */
export function gapAt<T>(items: PlacedItem<T>[], index: number, length: number | null): Gap
{
    const minutes = length ?? 0
    if (items.length === 0)
    {
        const start = Math.max(FIRST_MINUTE, Math.min(NOON, 24 * 60 - minutes))
        return { index, start, room: 24 * 60 - FIRST_MINUTE, fits: fitsAt(items, start, length) }
    }
    if (index === 0)
    {
        const end = items[0]?.start ?? LAST_MINUTE
        const earliest = end - Math.max(minutes, 15)
        const start = Math.max(FIRST_MINUTE, earliest)
        return { index, start, room: end - FIRST_MINUTE, fits: earliest >= FIRST_MINUTE && fitsAt(items, start, length) }
    }
    const before = items[index - 1]
    const after = items[index]
    const start = Math.min(before.end, after?.start ?? before.end, LAST_MINUTE)
    const until = after?.start ?? 24 * 60
    return { index, start, room: until - before.end, fits: fitsAt(items, start, length) }
}

/**
 * Which gap a point at `start` is in: after every thing that starts before it,
 * or at the same moment and ends there.
 */
export function gapOf<T>(items: PlacedItem<T>[], start: number): number
{
    return items.filter(placed => placed.start < start || (placed.start === start && placed.end <= start)).length
}

/** Whether a point at `start`, lasting `length`, overlaps nothing, and ends by midnight. */
export function fitsAt<T>(items: PlacedItem<T>[], start: number, length: number | null): boolean
{
    const end = start + (length ?? 0)
    return end <= 24 * 60 && !items.some(placed => overlaps(start, end, placed.start, placed.end))
}

/**
 * Why a point in the gap at `index` does not fit, without a clock time in it:
 * "2 h does not fit between Breakfast and Lunch: there is 1 h between them…".
 * `nameOf` names a thing.
 */
export function misfitReason<T>(items: PlacedItem<T>[], index: number, length: number | null, nameOf: (item: T) => string): string
{
    const long = length
        ? durationLabel(length)
        : 'It'
    const gap = gapAt(items, index, length)
    const room = gap.room > 0
        ? `there is ${durationLabel(gap.room)}`
        : 'there is no time'
    const end = gap.start + (length ?? 0)
    const into = items.find(placed => overlaps(gap.start, end, placed.start, placed.end))

    if (items.length === 0)
        return `${long} is longer than the day, so it runs past its end.`
    if (index === 0)
        return `${long} does not fit before ${nameOf(items[0].item)}: ${room} before it in the day. It is put as early as the day allows, and runs into ${nameOf((into ?? items[0]).item)}.`

    const before = items[index - 1]
    if (index === items.length)
        return into
            ? `${long} does not fit after ${nameOf(before.item)}: it starts when ${nameOf(before.item)} ends, and runs into ${nameOf(into.item)}.`
            : `${long} does not fit after ${nameOf(before.item)}: ${room} left in the day after it. It starts when ${nameOf(before.item)} ends, and runs past the end of the day.`

    const after = items[index]
    if (before.end > after.start)
        return `${nameOf(before.item)} and ${nameOf(after.item)} overlap, so there is no time between them. ${long} is put where ${nameOf(after.item)} starts, during ${nameOf(before.item)}.`
    return `${long} does not fit between ${nameOf(before.item)} and ${nameOf(after.item)}: ${room} between them. It starts when ${nameOf(before.item)} ends, and runs into ${nameOf((into ?? after).item)}.`
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * Whether two spans share any time. An instant overlaps a span it is strictly
 * inside — not one it starts or ends — and two instants never overlap.
 */
function overlaps(a0: number, a1: number, b0: number, b1: number): boolean
{
    if (a0 === a1)
        return b0 < a0 && a0 < b1
    if (b0 === b1)
        return a0 < b0 && b0 < a1
    return a0 < b1 && b0 < a1
}
