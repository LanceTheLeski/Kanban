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
 * picture is drawn by code (see DayArt) and the rules change behaviour. A type
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
 * anything that is on one shows as a count on its picture, and the day's quick
 * actions offer to move it to the next working day.
 */

/** Which picture a type is drawn with — see DayArt. */
export type Scene = 'city' | 'park' | 'beach'

export interface DayType {
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
    /** Where carried-over work may land. */
    working: boolean
    /** What the day overlay says with no cards on the day. */
    emptyNote: string
    /** What it says above the cards, on a day that does not expect work. */
    busyNote?: string
}

/** A day nobody has given a type: measured, like a working day, with no picture. */
export const NO_DAY_TYPE: DayType = {
    id: 0,
    name: 'No theme',
    scene: null,
    blurb: 'Just the day.',
    ring: true,
    progress: true,
    invites: true,
    working: true,
    emptyNote: 'Nothing is on this day yet.',
}

/** In the order the picker lists them. */
export const DAY_TYPES: DayType[] = [
    {
        id: 1,
        name: 'Work',
        scene: 'city',
        blurb: 'A working day: progress is tracked.',
        ring: true,
        progress: true,
        invites: true,
        working: true,
        emptyNote: 'Nothing is on this day yet.',
    },
    {
        id: 2,
        name: 'Leisure',
        scene: 'park',
        blurb: 'A day off with plans: what is on, not how far along.',
        ring: true,
        progress: false,
        invites: false,
        working: false,
        emptyNote: 'Nothing planned yet.',
        busyNote: 'A day off: these are plans, not targets.',
    },
    {
        id: 3,
        name: 'Vacation',
        scene: 'beach',
        blurb: 'Away: nothing is expected, and no graphs.',
        ring: false,
        progress: false,
        invites: false,
        working: false,
        emptyNote: 'Nothing is on — as it should be.',
        busyNote: 'A vacation day: nothing on it is expected to get done.',
    },
]

/** A stored type number's type. A number this list does not know is no theme. */
export function dayTypeOf(id: number | null | undefined): DayType {
    return DAY_TYPES.find(type => type.id === id) ?? NO_DAY_TYPE
}
