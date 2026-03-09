/**
 * board.types.ts
 *
 * TypeScript equivalents of the C# domain models in ArcStrides.UI/Models/Board/.
 * Naming follows camelCase (TypeScript convention) but maps 1:1 to the C# classes.
 *
 * C# nullable reference types (string?, Guid?) become T | null here.
 * C# Guid → string (UUIDs are strings in JS/TS).
 * C# DateTime → Date | null.
 */

// ── TaskType ─────────────────────────────────────────────────────────────────

/** Mirrors: Models/Board/TaskType.cs */
export interface TaskType {
    id: number
    groupTagId: string
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
    id: string | null
    title: string
    order: number
    taskType: TaskType | null
    isCompleted: boolean | null
    timeline: Timeline | null
}

// ── Card ─────────────────────────────────────────────────────────────────────

/** Mirrors: Models/Board/Card.cs */
export interface Card {
    id: string
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

/**
 * Mirrors: Models/Board/DropCard.cs
 *
 * dropArea encodes the cell position as "{swimlaneOrder}_{columnOrder}",
 * matching the Blazor ConvertColumnAndSwimlaneToCardArea() helper.
 */
export interface DropCard {
    card: Card
    dropArea: string
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

// ── TaskTypeResponse (API response shape) ─────────────────────────────────────

/**
 * Mirrors: ArcStrides.Contracts.Response.TaskTypeResponse
 * Used by CreateTaskOverlay and UpdateTaskPopover when fetching task type lists.
 */
export interface TaskTypeResponse {
    id: number
    title: string | null
    groupTagId: string | null
}