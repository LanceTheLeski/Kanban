/**
 * board.api.ts
 *
 * Real HTTP API layer for all board operations.
 *
 * Replaces the C# repository interfaces:
 *   IBoardRepository    → fetchBoard
 *   ICardRepository     → createCard, moveCard, updateCard, deleteCard
 *   IColumnRepository   → createColumn, updateColumn, deleteColumn
 *   ISwimlaneRepository → createSwimlane, updateSwimlane, deleteSwimlane
 *   ITaskRepository     → createTask, updateTask, deleteTask, fetchTaskTypes
 *   ITimelineRepository → createTimeline, updateTimeline
 *
 * ── JSON Patch ────────────────────────────────────────────────────────────────
 * The Blazor .cs partial classes built raw JSON Patch strings manually using
 * string interpolation. Here we build typed PatchOperation arrays instead —
 * same wire format, no risk of malformed JSON from string concatenation.
 *
 * The path strings (e.g. "/Title", "/ColumnID") must match the property names
 * your ASP.NET Core controllers expect. Check your JsonPatchDocument<T> usage
 * on the server and adjust casing if needed.
 *
 * ── Null / empty patch guard ──────────────────────────────────────────────────
 * Several Blazor methods returned early if both patch fields were empty strings.
 * We preserve this: callers only invoke these functions when there is actually
 * something to send. The functions themselves do not guard against empty arrays.
 */

import { apiClient, type PatchOperation } from './Client'
import type { Column, DropCard, Swimlane, Task, TaskTypeResponse, Timeline } from '../Types/Board.Types'

// ── Board ─────────────────────────────────────────────────────────────────────

/**
 * Shape of the server's GET /boards/:boardId response.
 * Mirrors ArcStrides.Contracts.Response.BoardResponse.
 */
export interface BoardResponse {
    id: string
    columns: Array<{ id: string; title: string; order: number }>
    swimlanes: Array<{ id: string; title: string; order: number }>
    cards: Array<{
        id: string
        positionId: string
        title: string
        description: string
        columnId: string
        columnTitle: string
        columnOrder: number
        swimlaneId: string
        swimlaneTitle: string
        swimlaneOrder: number
        tasks: Task[]
        timeline: Timeline | null
    }>
}

/** GET /boards/:boardId */
export function fetchBoard(boardId: string): Promise<BoardResponse> {
    return apiClient.get(`/arcstrides/boards/${boardId}`)
}

// ── Card ──────────────────────────────────────────────────────────────────────

/**
 * Shape of the server's card position response.
 * Mirrors ArcStrides.Contracts.Response.CardPositionResponse.
 * Returned by both POST /cards and PATCH /cards/:positionId.
 */
interface CardPositionResponse {
    id: string
    positionID: string
    title: string
    description: string
    columnID: string
    columnTitle: string
    columnOrder: number
    swimlaneID: string
    swimlaneTitle: string
    swimlaneOrder: number
}

export interface CardCreateRequest {
    title: string
    description: string
    columnId: string
    swimlaneId: string
}

/**
 * POST /boards/:boardId/cards
 *
 * Mirrors Blazor's CreateCardAsync() in CreateCardOverlay.cs.
 * The server returns a CardPositionResponse with the assigned column/swimlane
 * order values — we use those to build the dropArea string rather than
 * inferring it from local state, so the two are always in sync.
 */
export async function createCard(boardId: string, req: CardCreateRequest): Promise<DropCard> {
    const response = await apiClient.post<CardPositionResponse>(
        `/boards/${boardId}/cards`,
        {
            Title: req.title,
            Description: req.description,
            ColumnID: req.columnId,
            SwimlaneID: req.swimlaneId,
        }
    )

    return {
        dropArea: `${response.swimlaneOrder}_${response.columnOrder}`,
        card: {
            id: response.id,
            positionId: response.positionID,
            title: response.title,
            description: response.description,
            columnId: response.columnID,
            columnName: response.columnTitle,
            columnNumber: response.columnOrder,
            swimlaneId: response.swimlaneID,
            swimlaneName: response.swimlaneTitle,
            swimlaneNumber: response.swimlaneOrder,
            tasks: [],
            timeline: null,
        },
    }
}

export interface CardMoveRequest {
    columnId: string
    columnTitle: string
    columnOrder: number
    swimlaneId: string
    swimlaneTitle: string
    swimlaneOrder: number
}

/**
 * PATCH /boards/:boardId/cards/:positionId
 *
 * Called on drag-drop. Mirrors Blazor's SendCardPatchRequest() in Board.cs.
 * The Blazor version built a raw JSON string; here we use typed operations.
 */
export function moveCard(boardId: string, positionId: string, req: CardMoveRequest): Promise<void> {
    const operations: PatchOperation[] = [
        { op: 'replace', path: '/ColumnID', value: req.columnId },
        { op: 'replace', path: '/ColumnTitle', value: req.columnTitle },
        { op: 'replace', path: '/ColumnOrder', value: req.columnOrder },
        { op: 'replace', path: '/SwimlaneID', value: req.swimlaneId },
        { op: 'replace', path: '/SwimlaneTitle', value: req.swimlaneTitle },
        { op: 'replace', path: '/SwimlaneOrder', value: req.swimlaneOrder },
    ]
    return apiClient.patch(`/boards/${boardId}/cards/${positionId}`, operations)
}

export interface CardPatchRequest {
    title?: string
    description?: string
}

/**
 * PATCH /boards/:boardId/cards/:cardId
 *
 * Called on UpdateCardOverlay submit. Mirrors FormPatchRequestFromOverlay()
 * in UpdateCardOverlay.cs — only includes operations for fields that changed.
 */
export function updateCard(boardId: string, cardId: string, patch: CardPatchRequest): Promise<void> {
    const operations: PatchOperation[] = []

    if (patch.title !== undefined)
        operations.push({ op: 'replace', path: '/Title', value: patch.title })

    if (patch.description !== undefined)
        operations.push({ op: 'replace', path: '/Description', value: patch.description })

    return apiClient.patch(`/boards/${boardId}/cards/${cardId}`, operations)
}

/** DELETE /boards/:boardId/cards/:cardId */
export function deleteCard(boardId: string, cardId: string): Promise<void> {
    return apiClient.delete(`/boards/${boardId}/cards/${cardId}`)
}

// ── Column ────────────────────────────────────────────────────────────────────

interface ColumnResponse {
    id: string
    title: string
    order: number
}

export interface ColumnCreateRequest {
    title: string
    order: number
}

/**
 * POST /boards/:boardId/columns
 * Mirrors CreateColumnAsync() in CreateColumnOverlay.cs.
 */
export async function createColumn(boardId: string, req: ColumnCreateRequest): Promise<Column> {
    const response = await apiClient.post<ColumnResponse>(
        `/boards/${boardId}/columns`,
        { Title: req.title, Order: req.order }
    )
    return { id: response.id, title: response.title, order: response.order }
}

export interface ColumnPatchRequest {
    title?: string
    order?: number
}

/**
 * PATCH /boards/:boardId/columns/:columnId
 * Mirrors FormPatchRequestFromOverlay() in UpdateColumnOverlay.cs.
 */
export function updateColumn(boardId: string, columnId: string, patch: ColumnPatchRequest): Promise<void> {
    const operations: PatchOperation[] = []

    if (patch.title !== undefined)
        operations.push({ op: 'replace', path: '/Title', value: patch.title })

    if (patch.order !== undefined)
        operations.push({ op: 'replace', path: '/Order', value: patch.order })

    return apiClient.patch(`/boards/${boardId}/columns/${columnId}`, operations)
}

/** DELETE /boards/:boardId/columns/:columnId */
export function deleteColumn(boardId: string, columnId: string): Promise<void> {
    return apiClient.delete(`/boards/${boardId}/columns/${columnId}`)
}

// ── Swimlane ──────────────────────────────────────────────────────────────────

interface SwimlaneResponse {
    id: string
    title: string
    order: number
}

export interface SwimlaneCreateRequest {
    title: string
    order: number
}

/** POST /boards/:boardId/swimlanes */
export async function createSwimlane(boardId: string, req: SwimlaneCreateRequest): Promise<Swimlane> {
    const response = await apiClient.post<SwimlaneResponse>(
        `/boards/${boardId}/swimlanes`,
        { Title: req.title, Order: req.order }
    )
    return { id: response.id, title: response.title, order: response.order }
}

export interface SwimlanePatchRequest {
    title?: string
    order?: number
}

/** PATCH /boards/:boardId/swimlanes/:swimlaneId */
export function updateSwimlane(boardId: string, swimlaneId: string, patch: SwimlanePatchRequest): Promise<void> {
    const operations: PatchOperation[] = []

    if (patch.title !== undefined)
        operations.push({ op: 'replace', path: '/Title', value: patch.title })

    if (patch.order !== undefined)
        operations.push({ op: 'replace', path: '/Order', value: patch.order })

    return apiClient.patch(`/boards/${boardId}/swimlanes/${swimlaneId}`, operations)
}

/** DELETE /boards/:boardId/swimlanes/:swimlaneId */
export function deleteSwimlane(boardId: string, swimlaneId: string): Promise<void> {
    return apiClient.delete(`/boards/${boardId}/swimlanes/${swimlaneId}`)
}

// ── Task ──────────────────────────────────────────────────────────────────────

interface TaskResponse {
    id: string
    title: string
    order: number
    taskType: { id: number; title: string; groupTagId: string | null } | null
    isCompleted: boolean | null
    timeline: Timeline | null
}

export interface TaskCreateRequest {
    title: string
    taskTypeId: number
    order: number
    isComplete: boolean
}

/**
 * POST /boards/:boardId/cards/:cardId/tasks
 * Mirrors CreateTaskAsync() in CreateTaskOverlay.cs.
 */
export async function createTask(boardId: string, cardId: string, req: TaskCreateRequest): Promise<Task> {
    const response = await apiClient.post<TaskResponse>(
        `/boards/${boardId}/cards/${cardId}/tasks`,
        {
            Title: req.title,
            TaskTypeID: req.taskTypeId,
            Order: req.order,
            IsComplete: req.isComplete,
        }
    )
    return {
        id: response.id,
        title: response.title,
        order: response.order,
        taskType: response.taskType,
        isCompleted: response.isCompleted,
        timeline: response.timeline,
    }
}

/**
 * PATCH /boards/:boardId/cards/:cardId/tasks/:taskId
 *
 * Mirrors UpdateTaskAsync() in UpdateTaskPopover.cs.
 * The caller (UpdateTaskPopover) passes a pre-diffed Record<string, unknown>
 * of only the fields that changed. We convert each entry to a JSON Patch
 * replace operation, capitalising the first letter to match C# property names.
 */
export function updateTask(
    boardId: string,
    cardId: string,
    taskId: string,
    patch: Record<string, unknown>
): Promise<void> {
    const operations: PatchOperation[] = Object.entries(patch).map(([key, value]) => ({
        op: 'replace',
        path: `/${key.charAt(0).toUpperCase()}${key.slice(1)}`,
        value,
    }))
    return apiClient.patch(`/boards/${boardId}/cards/${cardId}/tasks/${taskId}`, operations)
}

/** DELETE /boards/:boardId/cards/:cardId/tasks/:taskId */
export function deleteTask(boardId: string, cardId: string, taskId: string): Promise<void> {
    return apiClient.delete(`/boards/${boardId}/cards/${cardId}/tasks/${taskId}`)
}

/**
 * GET /taskTypes?groupIds=0,1,...
 * Mirrors FetchTaskTypesAsync() in CreateTaskOverlay.cs and UpdateTaskPopover.cs.
 */
export function fetchTaskTypes(groupIds: number[]): Promise<TaskTypeResponse[]> {
    const query = groupIds.map(id => `groupIds=${id}`).join('&')
    return apiClient.get(`/taskTypes?${query}`)
}

// ── Timeline ──────────────────────────────────────────────────────────────────

interface TimelineResponse {
    id: string
    startDependencyTagGroupId: string | null
    startPreferenceUTC: string | null
    startDeadlineUTC: string | null
    endDependencyTagGroupId: string | null
    endPreferenceUTC: string | null
    endDeadlineUTC: string | null
}

export interface TimelineCreateRequest {
    parentId: string | null
    timelineTypeId: number
    startPreferenceUTC: Date | null
    startDeadlineUTC: Date | null
    endPreferenceUTC: Date | null
    endDeadlineUTC: Date | null
}

/**
 * POST /boards/:boardId/timelines
 *
 * Mirrors CreateTimelineAsync() in UpdateTaskPopover.cs.
 * Dates are sent as ISO 8601 UTC strings. JSON.stringify converts Date objects
 * automatically, but we call toISOString() explicitly to make the intent clear.
 * The server returns strings which parseTimelineResponse converts back to Dates.
 */
export async function createTimeline(boardId: string, req: TimelineCreateRequest): Promise<Timeline> {
    const response = await apiClient.post<TimelineResponse>(
        `/boards/${boardId}/timelines`,
        {
            ParentID: req.parentId,
            TimelineTypeID: req.timelineTypeId,
            StartPreferenceUTC: req.startPreferenceUTC?.toISOString() ?? null,
            StartDeadlineUTC: req.startDeadlineUTC?.toISOString() ?? null,
            EndPreferenceUTC: req.endPreferenceUTC?.toISOString() ?? null,
            EndDeadlineUTC: req.endDeadlineUTC?.toISOString() ?? null,
        }
    )
    return parseTimelineResponse(response)
}

/**
 * PATCH /boards/:boardId/timelines/:timelineId
 *
 * Mirrors UpdateTimelineAsync() in UpdateTaskPopover.cs.
 * The caller builds the PatchOperation array directly (since it knows exactly
 * which date fields changed) and passes it through here unchanged.
 */
export function updateTimeline(
    boardId: string,
    timelineId: string,
    operations: PatchOperation[]
): Promise<void> {
    return apiClient.patch(`/boards/${boardId}/timelines/${timelineId}`, operations)
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Converts ISO 8601 date strings from the server back to Date | null.
 * The server stores and returns dates as UTC strings; we parse them here once
 * so all downstream code works with native Date objects.
 */
function parseTimelineResponse(r: TimelineResponse): Timeline {
    return {
        id: r.id,
        startDependencyTagGroupId: r.startDependencyTagGroupId,
        startPreferenceUTC: r.startPreferenceUTC ? new Date(r.startPreferenceUTC) : null,
        startDeadlineUTC: r.startDeadlineUTC ? new Date(r.startDeadlineUTC) : null,
        endDependencyTagGroupId: r.endDependencyTagGroupId,
        endPreferenceUTC: r.endPreferenceUTC ? new Date(r.endPreferenceUTC) : null,
        endDeadlineUTC: r.endDeadlineUTC ? new Date(r.endDeadlineUTC) : null,
    }
}