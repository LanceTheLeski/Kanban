/**
 * DraggableCard
 *
 * Wraps BoardCard with dnd-kit drag behaviour.
 * Mirrors MudDropContainer's ItemRenderer, which made each DropCard draggable.
 *
 * The listeners go on the whole tile. What stops them swallowing a click on
 * Actions or Remove is the sensors refusing to activate on a press that began
 * inside an interactive element — see CardGrid.Sensors.
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
            <BoardCard card={card}
                       boardId={boardId}
                       dragProps={{ ...listeners, ...attributes }} />
        </Box>
    )
}

export default DraggableCard
