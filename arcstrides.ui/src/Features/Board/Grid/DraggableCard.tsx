/**
 * DraggableCard
 *
 * Wraps BoardCard with dnd-kit drag behaviour.
 * Mirrors MudDropContainer's ItemRenderer, which made each DropCard draggable.
 *
 * Only the drag handle strip carries the pointer listeners — putting them on the
 * whole tile would swallow clicks on the Actions and Remove buttons.
 */

import React from 'react'
import { Box } from '@mui/material'
import { useDraggable } from '@dnd-kit/core'
import { BoardCard } from '../BoardCard'
import type { Card } from '../../../Entities/Card/Card.Types'

interface DraggableCardProps {
    card: Card
    boardId: string
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ card, boardId }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })

    return (
        <Box ref={setNodeRef} sx={{ opacity: isDragging ? 0.4 : 1, width: '100%' }}>
            <BoardCard
                card={card}
                boardId={boardId}
                dragHandleProps={{ ...listeners, ...attributes }}
            />
        </Box>
    )
}

export default DraggableCard
