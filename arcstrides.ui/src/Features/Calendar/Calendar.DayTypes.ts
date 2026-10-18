/**
 * Calendar.DayTypes.ts
 *
 * The kinds of day there are, and what each one changes about how a day is
 * drawn.
 *
 * Mirrors: the date-type selector in UpdateDateOverlay.razor — an expanding
 * selector over a `_dateTypeList` that was never filled — and the gradient
 * swatch beside it, whose click was to open a palette picker. They were one
 * idea: a day has a kind, and the kind has a look. Here the kind is one of a
 * few fixed themes, and the look is its picture rather than a colour.
 *
 * ── Fixed, and defined here ──────────────────────────────────────────────────
 * The API stores only the number, as Date.DateTypeID. What each number means —
 * its name, its picture, what it does to the graphs — lives here, because the
 * picture is drawn by code (see DayTypeSceneArt) and the rules change behaviour. A type
 * someone could make up would have neither. If user-made types come, they would
 * be a table of their own, each built on one of these as its base theme.
 *
 * ── What a type changes ──────────────────────────────────────────────────────
 *                 ring   progress lines    an empty day shows
 *   no theme      yes    yes               "+ Add card"
 *   Work          yes    yes               "+ Add card", over its skyline
 *   Leisure       yes    no — its picture  its picture
 *   Vacation      no     no — its picture  its picture
 *
 * Work is measured: how far along each type of task is, which is what the lines
 * are for. Leisure is not a day of targets, so it keeps the ring — what is on —
 * and gives the lines' tile to its picture. A vacation expects nothing at all;
 * anything that is on one shows as a count on its picture.
 *
 * ── What the calendar's options change ───────────────────────────────────────
 * The table above is each type as it comes. The calendar's options (Calendar
 * menu → Options, stored by the API) can change three things about each: its
 * picture, whether its progress lines show, and the task type a new task on a
 * day of it starts as. And they give a day nobody has typed a type by default —
 * one for the weekend's days, which they name, and one for the rest. See
 * Calendar.Options for both; resolveDayType is where they meet a day.
 *
 * A day's own type always wins. Choosing "No theme" on a day is therefore a type
 * of its own (PLAIN_DAY_TYPE), stored, so that a weekend day can be plain on a
 * calendar whose weekends are Leisure; 0 means "nothing chosen — the default".
 */

import type { Dayjs } from 'dayjs'

/** Which picture a type is drawn with — see DayTypeSceneArt. */
export type Scene = 'city' | 'park' | 'beach'

export interface DayType
{
    /** What the API stores. Never reuse one: stored days keep their number. */
    id: number

    name: string

    /** Null for no theme, which has no picture. */
    scene: Scene | null

    /** What the type is for, in a line, under its name in the picker. */
    blurb: string

    /** The ring of tasks by type round the day's number. */
    ring: boolean

    /** The progress lines — without them, their tile shows the picture. */
    progress: boolean

    /** An empty day offers to add a card, rather than showing its picture. */
    invites: boolean

    /** What the day overlay says with no cards on the day. */
    emptyNote: string

    /** What it says above the cards, on a day that does not expect work. */
    busyNote?: string

    /** The task type a new task on a day of this type starts as; null for none. */
    defaultTaskTypeId: number | null
}

/** A day nobody has given a type: measured, like a working day, with no picture. */
export const NO_DAY_TYPE: DayType =
{
    id: 0,
    name: 'No theme',
    scene: null,
    blurb: 'Just the day.',
    ring: true,
    progress: true,
    invites: true,
    emptyNote: 'Nothing is on this day yet.',
    defaultTaskTypeId: null,
}

/**
 * "No theme", chosen for a day: drawn as a day with none, but stored, so it
 * stands against the week's default rather than falling back to it.
 */
export const PLAIN_DAY_TYPE: DayType =
{
    ...NO_DAY_TYPE,
    id: 4,
    blurb: 'Just the day, whatever the week says.',
}

/** In the order the picker lists them. */
export const DAY_TYPES: DayType[] =
[
    {
        id: 1,
        name: 'Work',
        scene: 'city',
        blurb: 'A working day: progress is tracked.',
        ring: true,
        progress: true,
        invites: true,
        emptyNote: 'Nothing is on this day yet.',
        defaultTaskTypeId: null,
    },
    {
        id: 2,
        name: 'Leisure',
        scene: 'park',
        blurb: 'A day off with plans: what is on, not how far along.',
        ring: true,
        progress: false,
        invites: false,
        emptyNote: 'Nothing planned yet.',
        busyNote: 'A day off: these are plans, not targets.',
        defaultTaskTypeId: null,
    },
    {
        id: 3,
        name: 'Vacation',
        scene: 'beach',
        blurb: 'Away: nothing is expected, and no graphs.',
        ring: false,
        progress: false,
        invites: false,
        emptyNote: 'Nothing is on — as it should be.',
        busyNote: 'A vacation day: nothing on it is expected to get done.',
        defaultTaskTypeId: null,
    },
]

/** The pictures there are, for choosing one: each type's own, in the picker's order. */
export const SCENES: { scene: Scene; name: string }[] =
[
    { scene: 'city', name: 'City' },
    { scene: 'park', name: 'Park' },
    { scene: 'beach', name: 'Beach' },
]

/** A stored type number's type, as it comes. A number this list does not know is no theme. */
export function dayTypeOf(id: number | null | undefined): DayType
{
    return id === PLAIN_DAY_TYPE.id
        ? PLAIN_DAY_TYPE
        : DAY_TYPES.find(type => type.id === id) ?? NO_DAY_TYPE
}

/** What the calendar's options change about one type. */
export interface DayTypeChange
{
    scene: Scene | null

    progress: boolean

    defaultTaskTypeId: number | null
}

/** The calendar's options, as the day types need them — see Calendar.Options. */
export interface DayTypeOptions
{
    /** Day-of-week numbers, Sunday 0, as dayjs's `day()`. */
    weekendDays: number[]

    /** What a weekend day is with none of its own; 0 for no theme. */
    weekendTypeId: number

    /** What any other day is with none of its own; 0 for no theme. */
    weekdayTypeId: number

    /** By type number. A type not here is as it comes. */
    changes: Record<number, DayTypeChange>
}

/** A type with the options' changes to it. */
export function configuredDayType(id: number, options: DayTypeOptions): DayType
{
    const type = dayTypeOf(id)
    const change = options.changes[type.id]
    return change && type.id !== NO_DAY_TYPE.id && type.id !== PLAIN_DAY_TYPE.id
        ? { ...type, scene: change.scene, progress: change.progress, defaultTaskTypeId: change.defaultTaskTypeId }
        : type
}

/** Whether a date is one of the weekend's days, by the options. */
export function isWeekend(date: Dayjs, options: DayTypeOptions): boolean
{
    return options.weekendDays.includes(date.day())
}

/**
 * What kind of day a date is: its own type when it has one, otherwise the
 * default for its half of the week. Every place a day is drawn asks this.
 */
export function resolveDayType(date: Dayjs, storedId: number | null | undefined, options: DayTypeOptions): DayType
{
    return configuredDayType(storedId
        ? storedId
        : defaultDayTypeId(date, options), options)
}

/** The type a date has when nobody has chosen one. */
export function defaultDayTypeId(date: Dayjs, options: DayTypeOptions): number
{
    return isWeekend(date, options)
        ? options.weekendTypeId
        : options.weekdayTypeId
}
