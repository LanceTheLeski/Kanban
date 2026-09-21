/**
 * Card entity.
 *
 * Mirrors: ArcStrides.UI.Legacy/Models/Board/Card.cs
 *
 * Shared rather than board-owned: cards appear on the board and, once Calendar is
 * converted, on the month grid too.
 *
 * `id` is the card's own ID; `positionId` is the ID of its CardPosition row — a
 * separate entity on the server. Moving a card PATCHes the *position*, so both IDs
 * have to be carried. (The Blazor Card model had the same pair: Id + PositionID.)
 *
 * The column/swimlane fields are a denormalised copy of where the card currently
 * sits, exactly as CardPositionResponse sends them. They belong to the card's
 * position rather than to the card itself, which is why the board matches cells on
 * columnId/swimlaneId rather than on the order numbers — see Pages/BoardPage.tsx.
 *
 * There is deliberately no `dropArea` field. The Blazor DropCard encoded the grid
 * cell as "{swimlaneOrder}_{columnOrder}" and stored it alongside the card, which
 * meant every column or swimlane reorder silently invalidated it.
 */

import type { Task } from '../Task/Task.Types'
import type { Timeline } from '../Timeline/Timeline.Types'

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
    /**
     * Where the card sits within its cell. Lower is nearer the top.
     *
     * Belongs to the CardPosition row like the column and swimlane fields
     * above it — a card does not have a rank, a card *in a cell* does.
     */
    positionRank: number
    tasks: Task[]
    timeline: Timeline | null
}
