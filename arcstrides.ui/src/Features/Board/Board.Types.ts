/**
 * Board.Types.ts
 *
 * Types that belong to the board feature and nothing else.
 *
 * Card, Task, TaskType and Timeline used to live here too, but they are domain
 * entities the calendar uses as well — it puts cards on the month grid and
 * lists their tasks' deadlines. They live under src/Entities/, so the calendar
 * can import them without reaching into this feature.
 *
 * Columns and swimlanes stay here: they are how a *board* is arranged, and mean
 * nothing on a calendar.
 *
 * These are *domain* types. The raw shapes the API sends over the wire live in
 * Board.APIs.ts as `*Response` interfaces and are mapped into these on the way in.
 * Keeping the two separate means the server's quirks (the nested `position`
 * object, `columnID`-style casing) stay in one file.
 *
 * In Blazor, columns and swimlanes were passed around as parallel List<Guid> and
 * List<string> arrays that had to stay index-aligned — fragile enough that the
 * UpdateColumnOverlay bug comment acknowledged it. One object per item instead.
 */

/**
 * Columns and swimlanes are the same shape, but they are not the same thing and
 * a shared `OrderedItem` type would let one be passed where the other is meant.
 */
export interface Column
{
    id: string

    title: string

    order: number

    /** The ground its name is written on. Null falls back to the ramp — see Board.Colours. */
    colour: string | null

    /** The colour it keeps across boards built from the same template. */
    globalColour: string | null
}

export interface Swimlane
{
    id: string

    title: string

    order: number

    colour: string | null

    globalColour: string | null
}

/**
 * The swimlane a card is in on a board that has none.
 *
 * The server's empty GUID (CardPosition.SwimlaneID): a board may have no
 * swimlanes, and its cards then sit straight in their columns, in one row with
 * no label. A card that names a swimlane the board does not have is put there
 * too, so it is drawn somewhere rather than nowhere — see Board.Store.
 */
export const NO_SWIMLANE_ID = '00000000-0000-0000-0000-000000000000'

/**
 * The row a card with no swimlane is drawn in, as a swimlane, so the grid and a
 * drag can treat it as one more lane. Never sent to the server as a swimlane —
 * only its ID is, on a card.
 */
export const NO_SWIMLANE: Swimlane =
{
    id: NO_SWIMLANE_ID,
    title: '',
    order: 0,
    colour: null,
    globalColour: null,
}
