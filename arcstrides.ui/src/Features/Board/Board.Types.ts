/**
 * Board.Types.ts
 *
 * Types that belong to the board feature and nothing else.
 *
 * Card, Task, TaskType and Timeline used to live here too, but they are domain
 * entities the Calendar page will need as well — the legacy CalendarDate.razor
 * renders cards and tasks on the month grid. They now live under src/Entities/,
 * so Calendar can import them without reaching into this feature.
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

export interface Column {
    id: string
    title: string
    order: number
}

export interface Swimlane {
    id: string
    title: string
    order: number
}
