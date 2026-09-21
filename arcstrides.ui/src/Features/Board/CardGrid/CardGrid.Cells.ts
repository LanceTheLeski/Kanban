/**
 * CardGrid.Cells
 *
 * How a card finds its square on the grid.
 *
 * ── Why IDs and not orders ───────────────────────────────────────────────────
 * Blazor's MudDropContainer matched on a "{swimlaneOrder}_{columnOrder}" string
 * stored on each card: ItemsSelector="@((card, zone) => card.DropArea == zone)".
 * That string went stale the moment a column or swimlane was reordered or
 * deleted, because nothing recomputed it — and reordering is a first-class
 * operation on this board, not an edge case.
 *
 * A cell is now addressed by the pair of IDs that define it. IDs do not shift
 * when orders do, so the identifier stays valid across every reorder.
 */

import type { Card } from '../../../Entities/Card/Card.Types'

/** The separator is a character that cannot appear in a GUID. */
const SEPARATOR = '|'

export const cellId = (swimlaneId: string, columnId: string) =>
    `${swimlaneId}${SEPARATOR}${columnId}`

export const parseCellId = (id: string): { swimlaneId: string; columnId: string } | null => {
    const [swimlaneId, columnId] = id.split(SEPARATOR)
    if (!swimlaneId || !columnId) return null
    return { swimlaneId, columnId }
}

/**
 * Every card, bucketed by the cell it belongs in.
 *
 * Built once per card list rather than filtering the whole array inside each of
 * the (columns × swimlanes) cells — that was O(cells × cards) per render, on a
 * component that re-renders on every drag frame.
 */
export function groupCardsByCell(cards: Card[]): Map<string, Card[]> {
    const groups = new Map<string, Card[]>()

    for (const card of cards) {
        const key = cellId(card.swimlaneId, card.columnId)
        const group = groups.get(key)
        if (group) group.push(card)
        else groups.set(key, [card])
    }

    return groups
}
