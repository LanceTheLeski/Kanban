/**
 * Calendar.Stats.ts
 *
 * The numbers behind a day's two graphs, and the colour each task type wears.
 *
 * Mirrors: CountTasksForEachBoardType and GetFormattedBoardTypeData in
 * CalendarLayout.cs — the donut and the line chart on every Blazor date. Their
 * labels were `//todo` and the donut counted tasks per *board*, but what the
 * charts were for was two things about the day's tasks: how far along they are,
 * and what kind of work they are. That is what these compute.
 *
 *   progress   done of total — a meter, because it is one ratio against a limit
 *   breakdown  tasks per type — a ring round the day's number, part-to-whole
 *
 * ── Colour follows the type, not its place in the day ────────────────────────
 * A type's colour comes from its position in the app's whole task-type list,
 * in ID order, so "Feature" is the same colour on every day of every month. A
 * colour picked from what happens to be on one day would repaint a type the
 * moment another type was added to that day.
 *
 * The one thing that can still move a colour is creating a new task type whose
 * ID sorts before existing ones. The fix is to store a colour on the type, the
 * way columns and swimlanes store theirs; until then this is as stable as the
 * data allows.
 *
 * ── The palette ──────────────────────────────────────────────────────────────
 * The eight-hue categorical reference palette, in its fixed order, validated
 * against the frosted sand a day sits on (#dfdccf at its darkest): every
 * adjacent pair clears the colour-blind and normal-vision separation floors.
 * Five hues sit under 3:1 contrast on that ground, so no type is ever told by
 * colour alone — the day overlay lists every type by name with its count, and
 * each task row in a day carries its type's mark.
 */

import type { Card } from '../../Entities/Card/Card.Types'
import type { TaskType } from '../../Entities/Task/Task.Types'

/** One slot per type, in this order and never cycled. */
export const TYPE_PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']

/** Tasks with no type: the de-emphasis grey, so they read as "not classified". */
export const UNTYPED_COLOUR = '#898781'

/** A ninth type onward, and a day's smallest types past the segment cap. */
export const OTHER_COLOUR = '#bdb8ac'

/**
 * Segments a ring will draw before folding the rest into "Other". Past about
 * six, slices of a small ring stop being comparable at a glance.
 */
export const MAX_SEGMENTS = 6

/** The progress meter: one hue, the unfilled track a lighter step of it. */
export const METER_FILL = '#2a78d6'
export const METER_TRACK = '#b7d3f6'

export interface TypeSlice {
    key: string
    title: string
    count: number
    colour: string
}

export interface DayStats {
    total: number
    done: number
    /** In palette order, then "No type", then "Other" — never by size. */
    slices: TypeSlice[]
}

/** Each task type's colour, from the full list of types. */
export function typeColours(types: TaskType[]): Map<number, string> {
    const sorted = [...types].sort((a, b) => a.id - b.id)
    return new Map(sorted.map((type, index) => [type.id, TYPE_PALETTE[index] ?? OTHER_COLOUR]))
}

/** Progress and type breakdown across every task on these cards. */
export function dayStats(cards: Card[], colours: Map<number, string>): DayStats {
    const tasks = cards.flatMap(card => card.tasks)
    const counts = new Map<string, TypeSlice>()

    for (const task of tasks) {
        const type = task.taskType
        const key = type ? `type:${type.id}` : 'untyped'
        const slice = counts.get(key) ?? {
            key,
            title: type?.title || 'No type',
            count: 0,
            colour: type ? colourOf(type.id, colours) : UNTYPED_COLOUR,
        }
        slice.count += 1
        counts.set(key, slice)
    }

    return {
        total: tasks.length,
        done: tasks.filter(task => task.isCompleted).length,
        slices: capped([...counts.values()].sort(bySlot)),
    }
}

/** A type's colour, or Other's for a type the list has not caught up with. */
export function colourOf(typeId: number | null | undefined, colours: Map<number, string>): string {
    if (typeId == null) return UNTYPED_COLOUR
    return colours.get(typeId) ?? OTHER_COLOUR
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Palette order, so a ring's segments sit in the same order on every day. */
function bySlot(a: TypeSlice, b: TypeSlice): number {
    return rank(a) - rank(b)
}

function rank(slice: TypeSlice): number {
    const slot = TYPE_PALETTE.indexOf(slice.colour)
    if (slot !== -1) return slot
    return slice.colour === UNTYPED_COLOUR ? TYPE_PALETTE.length : TYPE_PALETTE.length + 1
}

/** Past MAX_SEGMENTS, the smallest go into one "Other" segment. */
function capped(slices: TypeSlice[]): TypeSlice[] {
    if (slices.length <= MAX_SEGMENTS) return slices

    const bySize = [...slices].sort((a, b) => b.count - a.count)
    const kept = new Set(bySize.slice(0, MAX_SEGMENTS - 1).map(slice => slice.key))
    const folded = slices.filter(slice => !kept.has(slice.key))

    return [
        ...slices.filter(slice => kept.has(slice.key)),
        {
            key: 'other',
            title: `Other (${folded.map(slice => slice.title).join(', ')})`,
            count: folded.reduce((sum, slice) => sum + slice.count, 0),
            colour: OTHER_COLOUR,
        },
    ]
}
