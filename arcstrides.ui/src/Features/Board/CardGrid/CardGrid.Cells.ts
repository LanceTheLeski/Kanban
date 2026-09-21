/**
 * CardGrid.Cells
 *
 * How a card finds its square on the grid, and where in that square it sits.
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
 *
 * ── Rank is separate from the cell ───────────────────────────────────────────
 * The cell says *which square*; positionRank says *where in it*. Both live on
 * the CardPosition row, because neither belongs to the card itself — the same
 * card in a different cell has a different rank.
 */

import { arrayMove } from '@dnd-kit/sortable'
import type { Card } from '../../../Entities/Card/Card.Types'
import type { Column, Swimlane } from '../Board.Types'

/** Where a card should end up: which cell, and how far down it. */
export interface CardPlacement {
    cardId: string
    column: Column
    swimlane: Swimlane
    positionRank: number
}

/** The separator is a character that cannot appear in a GUID. */
const SEPARATOR = '|'

export const cellId = (swimlaneId: string, columnId: string) =>
    `${swimlaneId}${SEPARATOR}${columnId}`

export function parseCellId(id: string): { swimlaneId: string; columnId: string } | null {
    const [swimlaneId, columnId] = id.split(SEPARATOR)
    if (!swimlaneId || !columnId) return null
    return { swimlaneId, columnId }
}

/**
 * Every card, bucketed by the cell it belongs in and ordered within it.
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

    for (const group of groups.values()) group.sort(byRank)

    return groups
}

/**
 * The placements that put `cardId` at `targetIndex` of the target cell.
 *
 * `targetIndex` is an index into the target cell **as it currently stands**,
 * including the moving card when it is already in that cell. That detail is the
 * whole of the classic sortable off-by-one: computed against the cell with the
 * card already removed, dragging something downward onto its neighbour puts it
 * back above that neighbour, and the drop looks like it did nothing. Moving
 * within a list is `arrayMove`, not remove-then-insert.
 *
 * Returns every card whose cell or rank changes — the moved one and the
 * siblings it displaces, in both the cell it left and the cell it joined.
 * Ranks are reassigned densely from 0, so they stay a plain index rather than
 * drifting into gaps that later need repairing.
 *
 * ── Why the client computes this ─────────────────────────────────────────────
 * The server could renumber siblings itself, the way it does for columns,
 * swimlanes and tasks. Those three all reindex with a loop that calls
 * `Single (x => x.Order == index)` on each step, which throws the moment an
 * order is duplicated or has a gap — a fragility this project has paid for more
 * than once. The client already holds the whole cell and can hand over the
 * finished arrangement, so there is nothing to reconstruct and nothing to
 * throw.
 */
export function placementsForMove(cards: Card[],
                                  cardId: string,
                                  column: Column,
                                  swimlane: Swimlane,
                                  targetIndex: number): CardPlacement[] {
    const moving = cards.find(card => card.id === cardId)
    if (!moving) return []

    const sourceKey = cellId(moving.swimlaneId, moving.columnId)
    const targetKey = cellId(swimlane.id, column.id)

    const target = cards.filter(card => cellId(card.swimlaneId, card.columnId) === targetKey)
                        .sort(byRank)

    const fromIndex = target.findIndex(card => card.id === cardId)

    const arranged = fromIndex === -1
        ? insertAt(target, moving, clamp(targetIndex, 0, target.length))
        : arrayMove(target, fromIndex, clamp(targetIndex, 0, target.length - 1))

    const placements = arranged.map((card, index) => ({
        cardId: card.id,
        column,
        swimlane,
        positionRank: index,
    }))

    if (sourceKey === targetKey) return changedOnly(placements, cards)

    // The card left a gap behind it, so the cell it came from reindexes too.
    const source = cards.filter(card => cellId(card.swimlaneId, card.columnId) === sourceKey
                                        && card.id !== cardId)
                        .sort(byRank)

    for (const [index, card] of source.entries())
        placements.push({
            cardId: card.id,
            column: { id: moving.columnId, title: moving.columnName, order: moving.columnNumber },
            swimlane: { id: moving.swimlaneId, title: moving.swimlaneName, order: moving.swimlaneNumber },
            positionRank: index,
        })

    return changedOnly(placements, cards)
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function byRank(a: Card, b: Card): number {
    // Title as the tiebreak, so two cards that somehow share a rank still come
    // out in a stable order rather than swapping on every render.
    return a.positionRank - b.positionRank || a.title.localeCompare(b.title)
}

function insertAt(cards: Card[], card: Card, index: number): Card[] {
    const copy = [...cards]
    copy.splice(index, 0, card)
    return copy
}

function clamp(value: number, low: number, high: number): number {
    return Math.min(Math.max(value, low), high)
}

/** Drops the placements that would write a card back exactly where it is. */
function changedOnly(placements: CardPlacement[], cards: Card[]): CardPlacement[] {
    return placements.filter(placement => {
        const card = cards.find(candidate => candidate.id === placement.cardId)
        if (!card) return false

        return card.positionRank !== placement.positionRank
            || card.columnId !== placement.column.id
            || card.swimlaneId !== placement.swimlane.id
    })
}
