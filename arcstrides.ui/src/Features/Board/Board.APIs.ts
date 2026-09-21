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
 * are NOT the types the rest of the app uses — Board.Types.ts holds those.
 *
 * These are hand-written today but are meant to be generated. Once the API is
 * running, `npm run generate:api` writes src/Lib/Api.Schema.ts from its OpenAPI
 * document; replace the block below with aliases onto it:
 *
 *     import type { SchemaCardResponse, ... } from '../../Lib/Api.Schema'
 *     type CardResponse = SchemaCardResponse
 *
 * and delete the hand-written interfaces. Nothing else in this file changes —
 * the mappers already accept the `T | null | undefined` that a generated schema
 * produces (every C# contract property is nullable with no [Required], so
 * OpenAPI marks none of them required and every generated field is optional).
 * Absorbing that optionality is exactly what the mapping layer is for: below
 * this line, the rest of the app sees non-null domain types.
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
 * Patch paths address the JSON document, not the C# class, so they use the
 * serialized spelling: "/title", "/columnID". Under Newtonsoft these also
 * resolved case-insensitively, but Microsoft.AspNetCore.JsonPatch.SystemTextJson
 * gives no such guarantee — matching the wire names exactly is correct either way.
 */

import { apiClient, type PatchOperation } from '../../Lib/Client'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Task, TaskType } from '../../Entities/Task/Task.Types'
import type { Timeline } from '../../Entities/Timeline/Timeline.Types'
import type { Column, Swimlane } from './Board.Types'

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
    positionRank: number | null
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
function toDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null
}

function mapTimeline(response: TimelineResponse | null | undefined): Timeline | null {
    if (!response) return null

    /*
       A timeline with no dates and no ID is not a timeline.

       TaskResponse.Timeline is declared `= new TimelineResponse ()`, so the
       server sends an object with every field null for a task that has none.
       Taken at face value that is a timeline, and the panel opened every such
       task in Deadline mode — a card with nothing scheduled claiming a deadline
       it did not have. Timeless is what "no dates" means.
    */
    const hasAnything = response.id != null
        || response.startPreferenceUTC != null || response.startDeadlineUTC != null
        || response.endPreferenceUTC != null || response.endDeadlineUTC != null
    if (!hasAnything) return null

    return {
        id: response.id ?? null,
        startDependencyTagGroupId: response.startDependencyTagGroupID ?? null,
        startPreferenceUTC: toDate(response.startPreferenceUTC),
        startDeadlineUTC: toDate(response.startDeadlineUTC),
        endDependencyTagGroupId: response.endDependencyTagGroupID ?? null,
        endPreferenceUTC: toDate(response.endPreferenceUTC),
        endDeadlineUTC: toDate(response.endDeadlineUTC),
    }
}

export function mapTaskType(response: TaskTypeResponse | null | undefined): TaskType | null {
    if (!response || response.id == null) return null
    return {
        id: response.id,
        groupTagId: response.groupTagID ?? null,
        title: response.title ?? '',
    }
}

function mapTask(response: TaskResponse): Task {
    return {
        id: response.id ?? '',
        title: response.title ?? '',
        order: response.order ?? 0,
        taskType: mapTaskType(response.taskType),
        isCompleted: response.isComplete ?? null,
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
        positionRank: position?.positionRank ?? 0,
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
    /** Where in the cell it lands. Defaults to the top. */
    positionRank?: number
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
        // Top of the cell. The server has no opinion about where a new card
        // goes, and the alternative — every new card at rank 0 alongside every
        // other new card — is the tie the grid then has to break arbitrarily.
        PositionRank: request.positionRank ?? 0,
    })
}

export interface CardMoveRequest {
    columnId: string
    columnTitle: string
    columnOrder: number
    swimlaneId: string
    swimlaneTitle: string
    swimlaneOrder: number
    /** Where in the target cell it lands. */
    positionRank: number
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
        { op: 'replace', path: '/positionRank', value: request.positionRank },
        { op: 'replace', path: '/columnID', value: request.columnId },
        { op: 'replace', path: '/columnTitle', value: request.columnTitle },
        { op: 'replace', path: '/columnOrder', value: request.columnOrder },
        { op: 'replace', path: '/swimlaneID', value: request.swimlaneId },
        { op: 'replace', path: '/swimlaneTitle', value: request.swimlaneTitle },
        { op: 'replace', path: '/swimlaneOrder', value: request.swimlaneOrder },
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
        operations.push({ op: 'replace', path: '/title', value: patch.title })

    if (patch.description !== undefined)
        operations.push({ op: 'replace', path: '/description', value: patch.description })

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
        operations.push({ op: 'replace', path: '/title', value: patch.title })

    if (patch.order !== undefined)
        operations.push({ op: 'replace', path: '/order', value: patch.order })

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
 * The fields of TaskPatchRequest that this client patches, keyed exactly as the
 * server serializes them. Typing the keys means a rename on the C# side is a
 * compile error here rather than a silently ignored operation.
 */
export type TaskPatch = Partial<{
    title: string
    typeID: number
    order: number
    isComplete: boolean
}>

/**
 * PATCH arcstrides/boards/:boardId/cards/:cardId/tasks/:taskId
 *
 * Mirrors UpdateTaskAsync() in UpdateTaskPopover.cs. The caller passes a
 * pre-diffed record of only the fields that changed; each becomes a replace op.
 */
export function updateTask(
    boardId: string,
    cardId: string,
    taskId: string,
    patch: TaskPatch
): Promise<void> {
    const operations: PatchOperation[] = Object.entries(patch).map(([key, value]) => ({
        op: 'replace',
        path: `/${key}`,
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

/**
 * The tag group new task types are created under.
 *
 * Task types hang off a tag group, but the UI has no notion of tag groups yet —
 * there is no picker and nothing to pick from. The server ignores the grouping
 * on read (FetchTaskTypes queries `taskType => true`), so any valid Guid gives a
 * consistent home until tag groups are actually built. This is the same one the
 * seeder uses, so types created here and types seeded there sit together.
 */
export const DEFAULT_TASK_TYPE_TAG_GROUP_ID = '7b3f1c94-4d2e-4a61-9f0c-2e5a8d1b6c73'

/**
 * POST arcstrides/taggroups/:tagGroupId/tasks/types
 *
 * Returns the created type so the caller can select it immediately rather than
 * refetching and hunting for it by title.
 */
export async function createTaskType(
    title: string,
    tagGroupId: string = DEFAULT_TASK_TYPE_TAG_GROUP_ID,
): Promise<TaskType> {
    const response = await apiClient.post<TaskTypeResponse>(
        `${ARC}/taggroups/${tagGroupId}/tasks/types`,
        { Title: title },
    )

    const taskType = mapTaskType(response)
    if (!taskType)
        throw new Error('The server accepted the task type but did not return one with an ID.')

    return taskType
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
