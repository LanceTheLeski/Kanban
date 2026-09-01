/**
 * Board.APIs.ts
 *
 * HTTP API layer for all board operations.
 *
 * Replaces the C# repository interfaces:
 *   IBoardRepository    → fetchBoard
 *   ICardRepository     → createCard, moveCard, updateCard, deleteCard
 *   IColumnRepository   → createColumn, updateColumn, deleteColumn
 *   ISwimlaneRepository → createSwimlane, updateSwimlane, deleteSwimlane
 *   ITaskRepository     → createTask, updateTask, deleteTask, fetchTaskTypes
 *   ITimelineRepository → createTimeline, updateTimeline
 *
 * ── Route prefix ──────────────────────────────────────────────────────────────
 * Every controller in ArcStrides.API is routed under "arcstrides/" — see the
 * [Route] attributes on BoardController, ColumnController, SwimlaneController,
 * TaskController and TimelineController. That prefix is applied once, here, via
 * the ARC constant, so it cannot drift endpoint by endpoint.
 *
 * ── Wire shapes vs domain types ───────────────────────────────────────────────
 * The `*Response` interfaces below describe what the server literally sends. They
 * are NOT the types the rest of the app uses — Types/Board.Types.ts holds those.
 * Two server quirks are contained here and nowhere else:
 *
 *   1. A CardResponse nests its board placement under `position`
 *      (see ArcStrides.Contracts/Response/CardResponse.cs), rather than being flat.
 *
 *   2. Json.NET's CamelCaseNamingStrategy lowercases only the leading run of
 *      capitals, so C# `ColumnID` serializes as `columnID`, not `columnId`.
 *      `ID` on its own becomes `id`.
 *
 * ── JSON Patch ────────────────────────────────────────────────────────────────
 * The Blazor .cs partial classes built raw JSON Patch strings using string
 * interpolation — a card title containing a quote produced malformed JSON. Here we
 * build typed PatchOperation arrays instead: same wire format, no escaping hazard.
 *
 * The path strings ("/Title", "/ColumnID") are matched case-insensitively by
 * ASP.NET Core's JsonPatchDocument, so they keep working under the camelCase
 * contract resolver configured in Program.cs.
 */

import { apiClient, type PatchOperation } from './Client'
import type { Card, Column, Swimlane, Task, TaskType, Timeline } from '../Types/Board.Types'

/** Route prefix shared by every ArcStrides.API controller. */
const ARC = '/arcstrides'

// ── Wire shapes ───────────────────────────────────────────────────────────────

/** Mirrors ArcStrides.Contracts.Response.TimelineResponse */
interface TimelineResponse {
    id: string | null
    timelineTypeID: number | null
    startDependencyTagGroupID: string | null
    startPreferenceUTC: string | null
    startDeadlineUTC: string | null
    endDependencyTagGroupID: string | null
    endPreferenceUTC: string | null
    endDeadlineUTC: string | null
}

/** Mirrors ArcStrides.Contracts.Response.TaskTypeResponse */
export interface TaskTypeResponse {
    id: number | null
    groupTagID: string | null
    title: string | null
}

/** Mirrors ArcStrides.Contracts.Response.TaskResponse */
interface TaskResponse {
    id: string | null
    boardID: string | null
    title: string | null
    taskType: TaskTypeResponse | null
    order: number | null
    timeline: TimelineResponse | null
    isComplete: boolean | null
}

/** Mirrors ArcStrides.Contracts.Response.CardPositionResponse */
interface CardPositionResponse {
    id: string | null
    title: string | null
    description: string | null
    boardID: string | null
    columnID: string | null
    columnTitle: string | null
    columnOrder: number | null
    swimlaneID: string | null
    swimlaneTitle: string | null
    swimlaneOrder: number | null
}

/** Mirrors ArcStrides.Contracts.Response.CardResponse */
interface CardResponse {
    id: string | null
    title: string | null
    description: string | null
    position: CardPositionResponse | null
    tasks: TaskResponse[] | null
    timeline: TimelineResponse | null
}

/** Mirrors ArcStrides.Contracts.Response.ColumnResponse / SwimlaneResponse */
interface OrderedItemResponse {
    id: string | null
    title: string | null
    order: number | null
    boardID: string | null
}

/** Mirrors ArcStrides.Contracts.Response.BoardResponse */
interface BoardResponse {
    id: string | null
    title: string | null
    columns: OrderedItemResponse[] | null
    swimlanes: OrderedItemResponse[] | null
    cards: CardResponse[] | null
}

/** The whole board, mapped into domain types. */
export interface Board {
    id: string
    title: string
    columns: Column[]
    swimlanes: Swimlane[]
    cards: Card[]
}

// ── Response → domain mapping ─────────────────────────────────────────────────

/**
 * Converts ISO 8601 date strings from the server to Date | null.
 * The server stores and returns dates as UTC strings; we parse them here once so
 * all downstream code works with native Date objects.
 */
function toDate(value: string | null): Date | null {
    return value ? new Date(value) : null
}

function mapTimeline(response: TimelineResponse | null): Timeline | null {
    if (!response) return null
    return {
        id: response.id,
        startDependencyTagGroupId: response.startDependencyTagGroupID,
        startPreferenceUTC: toDate(response.startPreferenceUTC),
        startDeadlineUTC: toDate(response.startDeadlineUTC),
        endDependencyTagGroupId: response.endDependencyTagGroupID,
        endPreferenceUTC: toDate(response.endPreferenceUTC),
        endDeadlineUTC: toDate(response.endDeadlineUTC),
    }
}

export function mapTaskType(response: TaskTypeResponse | null): TaskType | null {
    if (!response || response.id == null) return null
    return {
        id: response.id,
        groupTagId: response.groupTagID,
        title: response.title ?? '',
    }
}

function mapTask(response: TaskResponse): Task {
    return {
        id: response.id ?? '',
        title: response.title ?? '',
        order: response.order ?? 0,
        taskType: mapTaskType(response.taskType),
        isCompleted: response.isComplete,
        timeline: mapTimeline(response.timeline),
    }
}

function mapOrderedItem(response: OrderedItemResponse): Column {
    return {
        id: response.id ?? '',
        title: response.title ?? '',
        order: response.order ?? 0,
    }
}

/**
 * Flattens a CardResponse (card + nested position) into the domain Card.
 *
 * Mirrors ArcStrides.UI.Legacy/Mappers/CardMapper.cs, which mapped
 * CardResponse.Position.ColumnOrder → Card.ColumnNumber and so on.
 *
 * Note the two different IDs: `response.id` is the card, `response.position.id`
 * is its CardPosition row. Moving a card patches the latter.
 */
function mapCard(response: CardResponse): Card {
    const position = response.position

    return {
        id: response.id ?? '',
        positionId: position?.id ?? '',
        title: response.title ?? '',
        description: response.description ?? '',
        columnId: position?.columnID ?? '',
        columnName: position?.columnTitle ?? '',
        columnNumber: position?.columnOrder ?? 0,
        swimlaneId: position?.swimlaneID ?? '',
        swimlaneName: position?.swimlaneTitle ?? '',
        swimlaneNumber: position?.swimlaneOrder ?? 0,
        // Sort tasks by order on load — mirrors Blazor's OrderBy(task => task.Order)
        tasks: (response.tasks ?? []).map(mapTask).sort((a, b) => a.order - b.order),
        timeline: mapTimeline(response.timeline),
    }
}

// ── Board ─────────────────────────────────────────────────────────────────────

/** GET arcstrides/boards/:boardId */
export async function fetchBoard(boardId: string): Promise<Board> {
    const response = await apiClient.get<BoardResponse>(`${ARC}/boards/${boardId}`)

    return {
        id: response.id ?? boardId,
        title: response.title ?? '',
        columns: (response.columns ?? []).map(mapOrderedItem).sort((a, b) => a.order - b.order),
        swimlanes: (response.swimlanes ?? []).map(mapOrderedItem).sort((a, b) => a.order - b.order),
        cards: (response.cards ?? []).map(mapCard),
    }
}

// ── Card ──────────────────────────────────────────────────────────────────────

export interface CardCreateRequest {
    title: string
    description: string
    columnId: string
    swimlaneId: string
}

/**
 * POST arcstrides/boards/:boardId/cards
 *
 * Mirrors Blazor's CreateCardAsync() in CreateCardOverlay.cs.
 *
 * The server responds with a CardPositionResponse whose `id` is the *position*
 * ID — the new card's own ID is not in the response (see CardController.CreateCard).
 * Callers therefore re-fetch the board rather than trying to splice the new card
 * into local state from this response.
 */
export async function createCard(boardId: string, request: CardCreateRequest): Promise<void> {
    await apiClient.post<CardPositionResponse>(`${ARC}/boards/${boardId}/cards`, {
        Title: request.title,
        Description: request.description,
        ColumnID: request.columnId,
        SwimlaneID: request.swimlaneId,
    })
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
 * PATCH arcstrides/boards/:boardId/cards/positions/:positionId
 *
 * Called on drag-drop. Mirrors Blazor's SendCardPatchRequest() in Board.cs.
 * Note this targets the card's *position* ID, not the card ID — the route is
 * BoardController's [HttpPatch("{boardID}/cards/positions/{cardPositionID}")].
 */
export function moveCard(boardId: string, positionId: string, request: CardMoveRequest): Promise<void> {
    const operations: PatchOperation[] = [
        { op: 'replace', path: '/ColumnID', value: request.columnId },
        { op: 'replace', path: '/ColumnTitle', value: request.columnTitle },
        { op: 'replace', path: '/ColumnOrder', value: request.columnOrder },
        { op: 'replace', path: '/SwimlaneID', value: request.swimlaneId },
        { op: 'replace', path: '/SwimlaneTitle', value: request.swimlaneTitle },
        { op: 'replace', path: '/SwimlaneOrder', value: request.swimlaneOrder },
    ]
    return apiClient.patch(`${ARC}/boards/${boardId}/cards/positions/${positionId}`, operations)
}

export interface CardPatchRequest {
    title?: string
    description?: string
}

/**
 * PATCH arcstrides/boards/:boardId/cards/:cardId
 *
 * Called on UpdateCardOverlay submit. Only includes operations for fields that
 * actually changed, mirroring FormPatchRequestFromOverlay() in UpdateCardOverlay.cs.
 *
 * Title and Description live on the Card entity rather than its CardPosition, so
 * this is a different route from moveCard above.
 */
export function updateCard(boardId: string, cardId: string, patch: CardPatchRequest): Promise<void> {
    const operations: PatchOperation[] = []

    if (patch.title !== undefined)
        operations.push({ op: 'replace', path: '/Title', value: patch.title })

    if (patch.description !== undefined)
        operations.push({ op: 'replace', path: '/Description', value: patch.description })

    return apiClient.patch(`${ARC}/boards/${boardId}/cards/${cardId}`, operations)
}

/** DELETE arcstrides/boards/:boardId/cards/:cardId */
export function deleteCard(boardId: string, cardId: string): Promise<void> {
    return apiClient.delete(`${ARC}/boards/${boardId}/cards/${cardId}`)
}

// ── Column ────────────────────────────────────────────────────────────────────

export interface ColumnCreateRequest {
    title: string
    order: number
}

/** POST arcstrides/boards/:boardId/columns */
export async function createColumn(boardId: string, request: ColumnCreateRequest): Promise<Column> {
    const response = await apiClient.post<OrderedItemResponse>(
        `${ARC}/boards/${boardId}/columns`,
        { Title: request.title, Order: request.order }
    )
    return mapOrderedItem(response)
}

export interface OrderedItemPatchRequest {
    title?: string
    order?: number
}

/**
 * PATCH arcstrides/boards/:boardId/columns/:columnId
 *
 * Reordering a column also rewrites every affected column *and card position* on
 * the server (ColumnController.UpdateColumnAndUpdateEffectedColumnsAndCardPositions),
 * so callers re-fetch the board afterwards rather than mirroring that locally.
 */
export function updateColumn(boardId: string, columnId: string, patch: OrderedItemPatchRequest): Promise<void> {
    return apiClient.patch(`${ARC}/boards/${boardId}/columns/${columnId}`, orderedItemOperations(patch))
}

/** DELETE arcstrides/boards/:boardId/columns/:columnId */
export function deleteColumn(boardId: string, columnId: string): Promise<void> {
    return apiClient.delete(`${ARC}/boards/${boardId}/columns/${columnId}`)
}

// ── Swimlane ──────────────────────────────────────────────────────────────────

/** POST arcstrides/boards/:boardId/swimlanes */
export async function createSwimlane(boardId: string, request: ColumnCreateRequest): Promise<Swimlane> {
    const response = await apiClient.post<OrderedItemResponse>(
        `${ARC}/boards/${boardId}/swimlanes`,
        { Title: request.title, Order: request.order }
    )
    return mapOrderedItem(response)
}

/** PATCH arcstrides/boards/:boardId/swimlanes/:swimlaneId */
export function updateSwimlane(boardId: string, swimlaneId: string, patch: OrderedItemPatchRequest): Promise<void> {
    return apiClient.patch(`${ARC}/boards/${boardId}/swimlanes/${swimlaneId}`, orderedItemOperations(patch))
}

/** DELETE arcstrides/boards/:boardId/swimlanes/:swimlaneId */
export function deleteSwimlane(boardId: string, swimlaneId: string): Promise<void> {
    return apiClient.delete(`${ARC}/boards/${boardId}/swimlanes/${swimlaneId}`)
}

/** Columns and swimlanes share an identical patch shape. */
function orderedItemOperations(patch: OrderedItemPatchRequest): PatchOperation[] {
    const operations: PatchOperation[] = []

    if (patch.title !== undefined)
        operations.push({ op: 'replace', path: '/Title', value: patch.title })

    if (patch.order !== undefined)
        operations.push({ op: 'replace', path: '/Order', value: patch.order })

    return operations
}

// ── Task ──────────────────────────────────────────────────────────────────────

export interface TaskCreateRequest {
    title: string
    taskTypeId: number
    order: number
    isComplete: boolean
}

/** POST arcstrides/boards/:boardId/cards/:cardId/tasks */
export async function createTask(boardId: string, cardId: string, request: TaskCreateRequest): Promise<Task> {
    const response = await apiClient.post<TaskResponse>(
        `${ARC}/boards/${boardId}/cards/${cardId}/tasks`,
        {
            Title: request.title,
            TaskTypeID: request.taskTypeId,
            Order: request.order,
            IsComplete: request.isComplete,
        }
    )
    return mapTask(response)
}

/**
 * PATCH arcstrides/boards/:boardId/cards/:cardId/tasks/:taskId
 *
 * Mirrors UpdateTaskAsync() in UpdateTaskPopover.cs. The caller passes a
 * pre-diffed record of only the fields that changed; each entry becomes a JSON
 * Patch replace operation with the first letter capitalised to match the C#
 * property names.
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
    return apiClient.patch(`${ARC}/boards/${boardId}/cards/${cardId}/tasks/${taskId}`, operations)
}

/** DELETE arcstrides/boards/:boardId/cards/:cardId/tasks/:taskId */
export function deleteTask(boardId: string, cardId: string, taskId: string): Promise<void> {
    return apiClient.delete(`${ARC}/boards/${boardId}/cards/${cardId}/tasks/${taskId}`)
}

/**
 * GET arcstrides/tasks/types?TaskTypeIDs=0,1
 *
 * Mirrors FetchTaskTypesAsync() in TaskRepository.cs, which sent the IDs as a
 * single comma-joined TaskTypeIDs parameter. The server currently ignores the
 * filter and returns every task type, but the parameter name is kept correct so
 * it starts working when TaskController's todo is addressed.
 */
export async function fetchTaskTypes(taskTypeIds: number[]): Promise<TaskType[]> {
    const query = encodeURIComponent(taskTypeIds.join(','))
    const response = await apiClient.get<TaskTypeResponse[]>(`${ARC}/tasks/types?TaskTypeIDs=${query}`)

    return response
        .map(mapTaskType)
        .filter((taskType): taskType is TaskType => taskType !== null)
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export interface TimelineCreateRequest {
    parentId: string | null
    timelineTypeId: number
    startPreferenceUTC: Date | null
    startDeadlineUTC: Date | null
    endPreferenceUTC: Date | null
    endDeadlineUTC: Date | null
}

/**
 * POST arcstrides/boards/:boardId/timelines
 *
 * Mirrors CreateTimelineAsync() in UpdateTaskPopover.cs. Dates are sent as ISO
 * 8601 UTC strings; the server returns strings which mapTimeline converts back.
 */
export async function createTimeline(boardId: string, request: TimelineCreateRequest): Promise<Timeline | null> {
    const response = await apiClient.post<TimelineResponse>(
        `${ARC}/boards/${boardId}/timelines`,
        {
            ParentID: request.parentId,
            TimelineTypeID: request.timelineTypeId,
            StartPreferenceUTC: request.startPreferenceUTC?.toISOString() ?? null,
            StartDeadlineUTC: request.startDeadlineUTC?.toISOString() ?? null,
            EndPreferenceUTC: request.endPreferenceUTC?.toISOString() ?? null,
            EndDeadlineUTC: request.endDeadlineUTC?.toISOString() ?? null,
        }
    )
    return mapTimeline(response)
}

/**
 * PATCH arcstrides/boards/:boardId/timelines/:timelineId
 *
 * Mirrors UpdateTimelineAsync() in UpdateTaskPopover.cs. The caller builds the
 * operation array directly since it knows which date fields changed.
 */
export function updateTimeline(
    boardId: string,
    timelineId: string,
    operations: PatchOperation[]
): Promise<void> {
    return apiClient.patch(`${ARC}/boards/${boardId}/timelines/${timelineId}`, operations)
}
