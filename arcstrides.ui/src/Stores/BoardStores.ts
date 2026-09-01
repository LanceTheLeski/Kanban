/**
 * BoardStores.ts
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
 * ── Why the board re-fetches after structural changes ───────────────────────
 * An earlier version of this store mirrored the server's reorder maths locally
 * so it could skip the extra GET. That is not safe here: the server rewrites
 * *card positions* as well as sibling orders whenever a column or swimlane is
 * created, reordered or deleted — see
 * ColumnController.UpdateColumnAndUpdateEffectedColumnsAndCardPositions. Mirroring
 * only the column order left every card pointing at a stale cell.
 *
 * So structural mutations call refresh() afterwards, which is what the Blazor UI
 * did too (Refresh(true) → OnInitializedAsync in Pages/Board.cs). Boards are small
 * and the GET is one round-trip.
 *
 * The exception is dragging a card, which is frequent and touches exactly one
 * row. That applies optimistically and rolls back if the PATCH fails — see
 * applyCardMove / restoreCard, used by Pages/BoardPage.tsx.
 *
 * ── State shape ─────────────────────────────────────────────────────────────
 * boardId   — identifies which board is loaded
 * cards     — every Card on this board, each carrying its own columnId/swimlaneId
 * columns   — Column objects (id + title + order), sorted by order
 * swimlanes — Swimlane objects (id + title + order), sorted by order
 * status    — drives the loading spinner and error panel on BoardPage
 */

import { create } from 'zustand'
import { fetchBoard } from '../APIs/Board.APIs'
import type { Card, Column, Swimlane } from '../Types/Board.Types'

export type BoardStatus = 'idle' | 'loading' | 'ready' | 'error'

interface BoardState {
    boardId: string | null
    title: string
    cards: Card[]
    columns: Column[]
    swimlanes: Swimlane[]
    status: BoardStatus
    error: string | null

    /** Loads a board from the server, replacing whatever is currently held. */
    loadBoard: (boardId: string) => Promise<void>

    /**
     * Re-reads the currently loaded board. Called after any mutation that can
     * shift more rows than the one being edited (see the note above).
     */
    refresh: () => Promise<void>

    /**
     * Moves a card into a new column/swimlane locally and returns the card as it
     * was, so the caller can hand it back to restoreCard() if the PATCH fails.
     * Returns null when the card is not in the store.
     */
    applyCardMove: (cardId: string, column: Column, swimlane: Swimlane) => Card | null

    /** Puts a previous card snapshot back — the rollback half of applyCardMove. */
    restoreCard: (card: Card) => void

    /** Replaces one card in place, e.g. after editing its title. */
    replaceCard: (card: Card) => void

    /** Drops one card from local state after a successful delete. */
    removeCard: (cardId: string) => void
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.order - b.order)
}

export const useBoardStore = create<BoardState>((set, get) => ({
    boardId: null,
    title: '',
    cards: [],
    columns: [],
    swimlanes: [],
    status: 'idle',
    error: null,

    loadBoard: async (boardId) => {
        set({ status: 'loading', error: null, boardId })

        try {
            const board = await fetchBoard(boardId)

            // Guard against a stale response landing after the user navigated to
            // another board — only the most recent request may write state.
            if (get().boardId !== boardId) return

            set({
                boardId: board.id,
                title: board.title,
                columns: sortByOrder(board.columns),
                swimlanes: sortByOrder(board.swimlanes),
                cards: board.cards,
                status: 'ready',
                error: null,
            })
        } catch (error) {
            if (get().boardId !== boardId) return
            set({
                status: 'error',
                error: error instanceof Error ? error.message : String(error),
            })
        }
    },

    refresh: async () => {
        const { boardId, loadBoard } = get()
        if (!boardId) return
        await loadBoard(boardId)
    },

    applyCardMove: (cardId, column, swimlane) => {
        const previous = get().cards.find(card => card.id === cardId)
        if (!previous) return null

        set(state => ({
            cards: state.cards.map(card =>
                card.id === cardId
                    ? {
                        ...card,
                        columnId: column.id,
                        columnName: column.title,
                        columnNumber: column.order,
                        swimlaneId: swimlane.id,
                        swimlaneName: swimlane.title,
                        swimlaneNumber: swimlane.order,
                    }
                    : card
            ),
        }))

        return previous
    },

    restoreCard: (card) =>
        set(state => ({
            cards: state.cards.map(existing => existing.id === card.id ? card : existing),
        })),

    replaceCard: (card) =>
        set(state => ({
            cards: state.cards.map(existing => existing.id === card.id ? card : existing),
        })),

    removeCard: (cardId) =>
        set(state => ({
            cards: state.cards.filter(card => card.id !== cardId),
        })),
}))
