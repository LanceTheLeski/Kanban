/**
 * Board.Types.ts
 *
 * TypeScript equivalents of the C# domain models in ArcStrides.UI.Legacy/Models/Board/.
 * Naming follows camelCase (TypeScript convention) but maps 1:1 to the C# classes.
 *
 * C# nullable reference types (string?, Guid?) become T | null here.
 * C# Guid → string (UUIDs are strings in JS/TS).
 * C# DateTime → Date | null.
 *
 * These are *domain* types. The raw shapes the API actually sends over the wire
 * live in APIs/Board.APIs.ts as `*Response` interfaces, and are mapped into these
 * on the way in. Keeping the two separate means the server's quirks (nested
 * `position` object, `columnID`-style casing from Json.NET) stay in one file.
 */

// ── TaskType ─────────────────────────────────────────────────────────────────

/** Mirrors: Models/Board/TaskType.cs */
export interface TaskType {
    id: number
    groupTagId: string | null
    title: string
}

// ── Timeline ─────────────────────────────────────────────────────────────────

/**
 * Mirrors: Models/Board/Timeline.cs
 *
 * UpdateTimelinePanel uses these fields to populate its date/time pickers.
 * The "preferred" fields map to the green Timeline mode; the "deadline" fields
 * to the yellow Deadline mode. Both being null means Timeless mode.
 */
export interface Timeline {
    id: string | null
    startDependencyTagGroupId: string | null
    startPreferenceUTC: Date | null
    startDeadlineUTC: Date | null
    endDependencyTagGroupId: string | null
    endPreferenceUTC: Date | null
    endDeadlineUTC: Date | null
}

// ── Task ─────────────────────────────────────────────────────────────────────

/** Mirrors: Models/Board/Task.cs */
export interface Task {
    id: string
    title: string
    order: number
    taskType: TaskType | null
    isCompleted: boolean | null
    timeline: Timeline | null
}

// ── Card ─────────────────────────────────────────────────────────────────────

/**
 * Mirrors: Models/Board/Card.cs
 *
 * `id` is the card's own ID; `positionId` is the ID of its CardPosition row —
 * a separate entity on the server. Moving a card PATCHes the *position*, so both
 * IDs have to be carried. (The Blazor Card model had the same pair: Id + PositionID.)
 *
 * There is deliberately no `dropArea` field. The Blazor DropCard encoded the grid
 * cell as the string "{swimlaneOrder}_{columnOrder}" and stored it alongside the
 * card, which meant every column/swimlane reorder silently invalidated it. The
 * cell is now derived at render time from columnId/swimlaneId instead — see
 * Pages/BoardPage.tsx.
 */
export interface Card {
    id: string
    positionId: string
    title: string
    description: string
    columnNumber: number
    columnId: string
    columnName: string
    swimlaneNumber: number
    swimlaneId: string
    swimlaneName: string
    tasks: Task[]
    timeline: Timeline | null
}

// ── Column / Swimlane ─────────────────────────────────────────────────────────

/**
 * In Blazor, columns and swimlanes were passed around as parallel List<Guid>
 * and List<string> arrays that had to stay index-aligned. This was fragile
 * (the UpdateColumnOverlay bug comment even acknowledged this).
 *
 * Here we use a single object per item — cleaner, safer, and easier to reorder.
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
