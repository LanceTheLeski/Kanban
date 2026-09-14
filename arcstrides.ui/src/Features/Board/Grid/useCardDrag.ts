/**
 * useCardDrag
 *
 * Everything that happens between picking a card up and putting it down.
 *
 * Mirrors Board.cs's UpdateCard(MudItemDropInfo<DropCard>) plus the sensor and
 * preview state MudDropContainer kept for us.
 *
 * ── Why a hook and not part of the grid component ────────────────────────────
 * Dragging is behaviour, and the grid is layout. They changed for different
 * reasons and at different times: the responsive pass rewrote the grid's boxes
 * without touching a line of this, and the move from order-based to ID-based
 * cells rewrote this without touching the boxes. Keeping them in one 550-line
 * component meant every change to either had to be made while reading both.
 *
 * It also makes the optimistic-move-then-roll-back sequence legible in one
 * screen, which is the part that is actually easy to get wrong.
 */

import { useState } from 'react'
import {
    type DragEndEvent,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../Board.Store'
import { moveCard } from '../Board.APIs'
import { useArcError } from '../../../Components/useArcError'
import { parseCellId } from './Board.Cells'
import type { Card } from '../../../Entities/Card/Card.Types'

export function useCardDrag(boardId: string | undefined) {
    const { columns, swimlanes, cards, applyCardMove, restoreCard } = useBoardStore(
        useShallow(state => ({
            columns: state.columns,
            swimlanes: state.swimlanes,
            cards: state.cards,
            applyCardMove: state.applyCardMove,
            restoreCard: state.restoreCard,
        })),
    )
    const { addError } = useArcError()
    const [draggingCard, setDraggingCard] = useState<Card | null>(null)

    // PointerSensor activates only after an 8px drag, so a click on the card's
    // Actions or Remove button is not read as the start of a drag.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    )

    const handleDragStart = (event: DragStartEvent) => {
        setDraggingCard(cards.find(card => card.id === String(event.active.id)) ?? null)
    }

    const handleDragCancel = () => setDraggingCard(null)

    const handleDragEnd = async (event: DragEndEvent) => {
        setDraggingCard(null)

        const { active, over } = event
        if (!over || !boardId) return

        const target = parseCellId(String(over.id))
        if (!target) return

        const cardId = String(active.id)
        const card = cards.find(candidate => candidate.id === cardId)
        if (!card) return

        // Nothing to do when the card was dropped back where it started
        if (card.columnId === target.columnId && card.swimlaneId === target.swimlaneId) return

        const column = columns.find(candidate => candidate.id === target.columnId)
        const swimlane = swimlanes.find(candidate => candidate.id === target.swimlaneId)
        if (!column || !swimlane) return

        // Move locally first so the card follows the cursor's drop immediately
        const previous = applyCardMove(cardId, column, swimlane)
        if (!previous) return

        try {
            // Mirrors Board.cs SendCardPatchRequest() — patches the card's position row
            await moveCard(boardId, card.positionId, {
                columnId: column.id,
                columnTitle: column.title,
                columnOrder: column.order,
                swimlaneId: swimlane.id,
                swimlaneTitle: swimlane.title,
                swimlaneOrder: swimlane.order,
            })
        } catch (moveError) {
            // Put the card back where it was — the server never accepted the move
            restoreCard(previous)
            const message = moveError instanceof Error ? moveError.message : String(moveError)
            addError(`Moving "${card.title}" failed: ${message}`)
        }
    }

    return { sensors, draggingCard, handleDragStart, handleDragEnd, handleDragCancel }
}
