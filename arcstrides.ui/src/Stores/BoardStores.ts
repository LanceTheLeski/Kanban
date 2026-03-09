/**
 * boardStore.ts
 *
 * Zustand store for all board-level server-derived state.
 *
 * ── Why Zustand and not Context? ────────────────────────────────────────────
 * React Context re-renders every consumer whenever any value in the context
 * changes. With a Kanban board that can have dozens of cards, columns, and
 * swimlanes, that's a lot of unnecessary re-renders. Zustand's selector-based
 * subscriptions mean a component only re-renders when the specific slice it
 * subscribes to changes.
 *
 * ── Why not TanStack Query for mutations? ───────────────────────────────────
 * TanStack Query's invalidateQueries pattern refetches the entire board after
 * every mutation. For most operations (create card, delete column, etc.) the
 * server already returns the canonical entity in its response — we have all
 * the information we need to update local state without another GET.
 *
 * Exception: reorder operations. Reordering a column shifts every other
 * column's order value. Rather than treating the server as a black box and
 * refetching, we mirror the server's deterministic reorder logic locally:
 * remove from old index → insert at new index → shift everything between.
 * This keeps UI and server state in sync without an extra round-trip.
 *
 * If a mutation fails, the calling component is responsible for reverting
 * or re-syncing (a future concern once real API calls are wired in).
 *
 * ── State shape ─────────────────────────────────────────────────────────────
 * boardId   — identifies which board is loaded
 * cards     — all DropCards on this board
 * columns   — Column objects (id + title + order), sorted by order
 * swimlanes — Swimlane objects (id + title + order), sorted by order
 */

import { create } from 'zustand'
import type { Column, DropCard, Swimlane } from '../Types/Board.Types'

// ── Reorder helper ────────────────────────────────────────────────────────────

/**
 * Mirrors the server's reorder behaviour exactly.
 *
 * Given a list sorted by `order`, moving item with `targetId` to `newOrder`:
 *   - Items between oldOrder and newOrder shift by ±1
 *   - The target item gets newOrder
 *   - Result is re-sorted by order
 *
 * This is the same as what Array.splice does conceptually:
 *   remove from oldIndex → insert at newIndex → all indices between shift.
 */
function reorderItems<T extends { id: string; order: number }>(
    items: T[],
    targetId: string,
    newOrder: number
): T[] {
    const item = items.find(i => i.id === targetId)
    if (!item) return items

    const oldOrder = item.order

    return items
        .map(i => {
            if (i.id === targetId) return { ...i, order: newOrder }

            // Moving target to a lower index (left): items in [newOrder, oldOrder) shift up
            if (newOrder < oldOrder && i.order >= newOrder && i.order < oldOrder)
                return { ...i, order: i.order + 1 }

            // Moving target to a higher index (right): items in (oldOrder, newOrder] shift down
            if (newOrder > oldOrder && i.order > oldOrder && i.order <= newOrder)
                return { ...i, order: i.order - 1 }

            return i
        })
        .sort((a, b) => a.order - b.order)
}

// ── Store interface ───────────────────────────────────────────────────────────

interface BoardState {
    boardId: string | null
    cards: DropCard[]
    columns: Column[]
    swimlanes: Swimlane[]

    // ── Bulk setters (used on initial board load) ──────────────────────────────
    setBoardId: (id: string) => void
    setCards: (cards: DropCard[]) => void
    setColumns: (columns: Column[]) => void
    setSwimlanes: (swimlanes: Swimlane[]) => void

    // ── Card mutations ─────────────────────────────────────────────────────────
    /** Called after POST /cards — uses the response object the server returned. */
    addCard: (card: DropCard) => void

    // ── Column mutations ───────────────────────────────────────────────────────

    /** Called after POST /columns. Server returns the new column with its assigned order. */
    addColumn: (column: Column) => void

    /**
     * Called after DELETE /columns/:id.
     * Removes the column and shifts all columns with a higher order down by 1
     * to keep the order sequence contiguous — matching server behaviour.
     */
    deleteColumn: (columnId: string) => void

    /**
     * Called after PATCH /columns/:id.
     * If newOrder is provided, applies the deterministic reorder.
     * If only title changes, updates in place.
     */
    updateColumn: (columnId: string, patch: { title?: string; newOrder?: number }) => void

    // ── Swimlane mutations ─────────────────────────────────────────────────────

    /** Called after POST /swimlanes. */
    addSwimlane: (swimlane: Swimlane) => void

    /**
     * Called after DELETE /swimlanes/:id.
     * Removes the swimlane and shifts remaining orders down.
     */
    deleteSwimlane: (swimlaneId: string) => void

    /**
     * Called after PATCH /swimlanes/:id.
     * Mirrors reorder logic if newOrder is provided.
     */
    updateSwimlane: (swimlaneId: string, patch: { title?: string; newOrder?: number }) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useBoardStore = create<BoardState>((set) => ({
    boardId: null,
    cards: [],
    columns: [],
    swimlanes: [],

    // ── Bulk setters ────────────────────────────────────────────────────────────
    setBoardId: (id) => set({ boardId: id }),
    setCards: (cards) => set({ cards }),
    setColumns: (columns) => set({ columns: [...columns].sort((a, b) => a.order - b.order) }),
    setSwimlanes: (swimlanes) => set({ swimlanes: [...swimlanes].sort((a, b) => a.order - b.order) }),

    // ── Card mutations ──────────────────────────────────────────────────────────
    addCard: (card) =>
        set((state) => ({ cards: [...state.cards, card] })),

    // ── Column mutations ────────────────────────────────────────────────────────
    addColumn: (column) =>
        set((state) => ({
            columns: [...state.columns, column].sort((a, b) => a.order - b.order),
        })),

    deleteColumn: (columnId) =>
        set((state) => {
            const deleted = state.columns.find(c => c.id === columnId)
            if (!deleted) return state

            return {
                columns: state.columns
                    .filter(c => c.id !== columnId)
                    .map(c => c.order > deleted.order ? { ...c, order: c.order - 1 } : c)
                    .sort((a, b) => a.order - b.order),
            }
        }),

    updateColumn: (columnId, { title, newOrder }) =>
        set((state) => {
            let updated = state.columns.map(c =>
                c.id === columnId && title !== undefined ? { ...c, title } : c
            )
            if (newOrder !== undefined) {
                updated = reorderItems(updated, columnId, newOrder)
            }
            return { columns: updated.sort((a, b) => a.order - b.order) }
        }),

    // ── Swimlane mutations ──────────────────────────────────────────────────────
    addSwimlane: (swimlane) =>
        set((state) => ({
            swimlanes: [...state.swimlanes, swimlane].sort((a, b) => a.order - b.order),
        })),

    deleteSwimlane: (swimlaneId) =>
        set((state) => {
            const deleted = state.swimlanes.find(s => s.id === swimlaneId)
            if (!deleted) return state

            return {
                swimlanes: state.swimlanes
                    .filter(s => s.id !== swimlaneId)
                    .map(s => s.order > deleted.order ? { ...s, order: s.order - 1 } : s)
                    .sort((a, b) => a.order - b.order),
            }
        }),

    updateSwimlane: (swimlaneId, { title, newOrder }) =>
        set((state) => {
            let updated = state.swimlanes.map(s =>
                s.id === swimlaneId && title !== undefined ? { ...s, title } : s
            )
            if (newOrder !== undefined) {
                updated = reorderItems(updated, swimlaneId, newOrder)
            }
            return { swimlanes: updated.sort((a, b) => a.order - b.order) }
        }),
}))