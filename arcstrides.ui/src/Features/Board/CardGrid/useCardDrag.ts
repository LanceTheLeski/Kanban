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
 * cells rewrote this without touching the boxes.
 *
 * ── A drop is a reorder, not a move ──────────────────────────────────────────
 * Cards carry a rank within their cell, so landing one somewhere pushes the
 * cards below it down and closes the gap it left behind. A drop therefore
 * rewrites a whole cell's ranks — both cells, when it crossed between them —
 * and the patch that follows is one request per card that actually moved.
 */

import { useState } from 'react'
import { type DragEndEvent, type DragStartEvent, useSensor, useSensors } from '@dnd-kit/core'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../Board.Store'
import { moveCard } from '../Board.APIs'
import { useArcError } from '../../../Components/useArcError'
import { cellId, groupCardsByCell, parseCellId, placementsForMove } from './CardGrid.Cells'
import {
    CARD_MOUSE_ACTIVATION,
    CARD_TOUCH_ACTIVATION,
    CardMouseSensor,
    CardTouchSensor,
} from './CardGrid.Sensors'
import type { Card } from '../../../Entities/Card/Card.Types'

export function useCardDrag(boardId: string | undefined) {
    const { columns, swimlanes, cards, applyCardPlacements, restoreCards } = useBoardStore(
        useShallow(state => ({
            columns: state.columns,
            swimlanes: state.swimlanes,
            cards: state.cards,
            applyCardPlacements: state.applyCardPlacements,
            restoreCards: state.restoreCards,
        })),
    )
    const { addError } = useArcError()
    const [draggingCard, setDraggingCard] = useState<Card | null>(null)

    // Two sensors rather than one PointerSensor, so a finger can still scroll a
    // full cell now that the whole card is draggable. See CardGrid.Sensors.
    const sensors = useSensors(
        useSensor(CardMouseSensor, { activationConstraint: CARD_MOUSE_ACTIVATION }),
        useSensor(CardTouchSensor, { activationConstraint: CARD_TOUCH_ACTIVATION }),
    )

    const handleDragStart = (event: DragStartEvent) => {
        setDraggingCard(cards.find(card => card.id === String(event.active.id)) ?? null)
    }

    const handleDragCancel = () => setDraggingCard(null)

    const handleDragEnd = async (event: DragEndEvent) => {
        setDraggingCard(null)

        const { active, over } = event
        if (!over || !boardId) return

        const cardId = String(active.id)
        const card = cards.find(candidate => candidate.id === cardId)
        if (!card) return

        const target = resolveTarget(String(over.id))
        if (!target) return

        const placements = placementsForMove(cards, cardId, target.column, target.swimlane, target.index)
        if (placements.length === 0) return

        // Move locally first so the cards settle under the cursor immediately.
        const previous = applyCardPlacements(placements)
        if (!previous) return

        try {
            // Mirrors Board.cs SendCardPatchRequest() — one patch per card whose
            // cell or rank actually changed.
            await Promise.all(placements.map(placement => {
                const moved = cards.find(candidate => candidate.id === placement.cardId)!

                return moveCard(boardId, moved.positionId, {
                    columnId: placement.column.id,
                    columnTitle: placement.column.title,
                    columnOrder: placement.column.order,
                    swimlaneId: placement.swimlane.id,
                    swimlaneTitle: placement.swimlane.title,
                    swimlaneOrder: placement.swimlane.order,
                    positionRank: placement.positionRank,
                })
            }))
        } catch (moveError) {
            // Put every card back — the arrangement was written as one move and
            // is undone as one, or the cell is left half-renumbered.
            restoreCards(previous)
            const message = moveError instanceof Error ? moveError.message : String(moveError)
            addError(`Moving "${card.title}" failed: ${message}`)
        }
    }

    return { sensors, draggingCard, handleDragStart, handleDragEnd, handleDragCancel }

    /**
     * Where the drop landed: which cell, and at what index inside it.
     *
     * dnd-kit reports whatever is under the cursor, which is a *card* when
     * hovering the stack and the *cell* only when hovering its empty space. Both
     * mean the same thing to us — drop into this cell — but only the first says
     * where in it.
     */
    function resolveTarget(overId: string) {
        const overCard = cards.find(candidate => candidate.id === overId)

        const cellKey = overCard
            ? cellId(overCard.swimlaneId, overCard.columnId)
            : overId

        const parsed = parseCellId(cellKey)
        if (!parsed) return null

        const column = columns.find(candidate => candidate.id === parsed.columnId)
        const swimlane = swimlanes.find(candidate => candidate.id === parsed.swimlaneId)
        if (!column || !swimlane) return null

        // The cell as it stands, moving card included — see placementsForMove
        // for why removing it first is the off-by-one.
        const occupants = groupCardsByCell(cards).get(cellKey) ?? []

        const index = overCard
            ? occupants.findIndex(candidate => candidate.id === overCard.id)
            : occupants.length

        return { column, swimlane, index: index === -1 ? occupants.length : index }
    }
}
