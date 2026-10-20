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
 *   progress   done of total for each type — a line per type, levelling out at
 *              its share done, so the types can be compared (see TaskProgressLineChart)
 *   breakdown  tasks per type — a ring round the day's number, part-to-whole
 *
 * ── Colour follows the type, not its place in the day ────────────────────────
 * A type's colour comes from its position in the app's whole task-type list,
 * in ID order, so "Feature" is the same colour on every day of every month. A
 * colour picked from what happens to be on one day would repaint a type the
 * moment another type was added to that day.
 *
 * A type can also have a colour of its own, stored on the type; that wins. It
 * is chosen from the board's Task types menu (TaskTypeColoursOverlay), and a
 * type made here is given one when it is made — the first colour of the
 * palette no type is wearing (freeTypeColour) — so a new type never moves the
 * others: type IDs are random, and a new one used to sort in among them and
 * hand every type after it the next slot's colour. A type with none takes the
 * palette's colours in ID order, skipping any a type has chosen, so no colour
 * is worn twice while the palette lasts.
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

/** The palette by name, for a colour picker offering it (TaskTypeColoursOverlay). */
export const TYPE_SWATCHES = ['Blue', 'Orange', 'Green', 'Amber', 'Pink', 'Leaf', 'Indigo', 'Red']
    .map((name, slot) => ({ colour: TYPE_PALETTE[slot], name }))

/** Tasks with no type: the de-emphasis grey, so they read as "not classified". */
export const UNTYPED_COLOUR = '#898781'

/** A ninth type onward, and a day's smallest types past the segment cap. */
export const OTHER_COLOUR = '#bdb8ac'

/**
 * Segments a ring will draw before folding the rest into "Other". Past about
 * six, slices of a small ring stop being comparable at a glance.
 */
export const MAX_SEGMENTS = 6

export interface TypeSlice
{
    key: string

    /** The task type; null for the untyped, and for Other. */
    typeId: number | null

    title: string

    count: number

    /** How many of `count` are done — each type's own progress. */
    done: number

    colour: string
}

export interface DayStats
{
    total: number

    done: number

    /** In palette order, then "No type", then "Other" — never by size. */
    slices: TypeSlice[]
}

/** Each task type's colour, from the full list of types. */
export function typeColours(types: TaskType[]): Map<number, string>
{
    const free = freePalette(types)
    let next = 0
    return new Map([...types].sort((a, b) => a.id - b.id)
                             .map(type => [type.id, type.colour ?? free[next++] ?? OTHER_COLOUR]))
}

/** The colour a type without one of its own has — see typeColours. */
export function defaultTypeColour(type: TaskType, types: TaskType[]): string
{
    const free = freePalette(types)
    const index = [...types].filter(other => !other.colour)
                            .sort((a, b) => a.id - b.id)
                            .findIndex(other => other.id === type.id)
    return free[index] ?? OTHER_COLOUR
}

/** The first colour of the palette no type is wearing, for a type just made; null when all are. */
export function freeTypeColour(types: TaskType[]): string | null
{
    const worn = new Set(typeColours(types).values())
    return TYPE_PALETTE.find(colour => !worn.has(colour)) ?? null
}

/** Progress and type breakdown across every task on these cards. */
export function dayStats(cards: Card[], colours: Map<number, string>): DayStats
{
    const tasks = cards.flatMap(card => card.tasks)
    const counts = new Map<string, TypeSlice>()

    for (const task of tasks)
    {
        const type = task.taskType
        const key = type
            ? `type:${type.id}`
            : 'untyped'
        const slice = counts.get(key) ?? {
            key,
            typeId: type?.id ?? null,
            title: type?.title || 'No type',
            count: 0,
            done: 0,
            colour: type
                ? colourOf(type.id, colours)
                : UNTYPED_COLOUR,
        }
        slice.count += 1
        if (task.isCompleted)
            slice.done += 1
        counts.set(key, slice)
    }

    return {
        total: tasks.length,
        done: tasks.filter(task => task.isCompleted).length,
        slices: capped([...counts.values()].sort(bySlot)),
    }
}

/** A type's colour, or Other's for a type the list has not caught up with. */
export function colourOf(typeId: number | null | undefined, colours: Map<number, string>): string
{
    if (typeId == null)
        return UNTYPED_COLOUR
    return colours.get(typeId) ?? OTHER_COLOUR
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The palette without the colours types have chosen, in order. */
function freePalette(types: TaskType[]): string[]
{
    const chosen = new Set(types.flatMap(type => (type.colour
        ? [type.colour.toLowerCase()]
        : [])))
    return TYPE_PALETTE.filter(colour => !chosen.has(colour.toLowerCase()))
}

/** Palette order, so a ring's segments sit in the same order on every day. */
function bySlot(a: TypeSlice, b: TypeSlice): number
{
    return rank(a) - rank(b)
}

/**
 * By type, in ID order — the order the palette's slots are handed out in, and
 * an order a type keeps when it is given a colour of its own — then the
 * untyped, then Other.
 */
function rank(slice: TypeSlice): number
{
    if (slice.typeId !== null)
        return slice.typeId
    return slice.key === 'untyped'
        ? Number.MAX_SAFE_INTEGER - 1
        : Number.MAX_SAFE_INTEGER
}

/** Past MAX_SEGMENTS, the smallest go into one "Other" segment. */
function capped(slices: TypeSlice[]): TypeSlice[]
{
    if (slices.length <= MAX_SEGMENTS)
        return slices

    const bySize = [...slices].sort((a, b) => b.count - a.count)
    const kept = new Set(bySize.slice(0, MAX_SEGMENTS - 1).map(slice => slice.key))
    const folded = slices.filter(slice => !kept.has(slice.key))

    return [
        ...slices.filter(slice => kept.has(slice.key)),
        {
            key: 'other',
            typeId: null,
            title: `Other (${folded.map(slice => slice.title).join(', ')})`,
            count: folded.reduce((sum, slice) => sum + slice.count, 0),
            done: folded.reduce((sum, slice) => sum + slice.done, 0),
            colour: OTHER_COLOUR,
        },
    ]
}
