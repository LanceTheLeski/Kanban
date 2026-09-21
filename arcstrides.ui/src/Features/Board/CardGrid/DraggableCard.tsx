/**
 * DraggableCard
 *
 * Wraps BoardCard with dnd-kit drag behaviour.
 * Mirrors MudDropContainer's ItemRenderer, which made each DropCard draggable.
 *
 * The listeners go on the whole tile. What stops them swallowing a click on
 * Actions or Remove is the sensors refusing to activate on a press that began
 * inside an interactive element — see CardGrid.Sensors.
 *
 * ── Sortable, not merely draggable ───────────────────────────────────────────
 * A card is now a drop target as well as a drag source, because cards have a
 * rank within their cell and "drop below this one" is a thing you have to be
 * able to say. useSortable is useDraggable and useDroppable together, plus the
 * transform that slides the other cards aside as you pass them — without which
 * a reorder gives no sign of where the card will land until you let go.
 */

import React from 'react'
import { Box } from '@mui/material'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BoardCard } from '../BoardCard'
import type { Card } from '../../../Entities/Card/Card.Types'

interface DraggableCardProps {
    card: Card
    boardId: string
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ card, boardId }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: card.id })

    return (
        <Box ref={setNodeRef}
             style={{ transform: CSS.Translate.toString(transform), transition }}
             sx={{ opacity: isDragging ? 0.4 : 1, width: '100%' }}>
            <BoardCard card={card}
                       boardId={boardId}
                       dragProps={{ ...listeners, ...attributes }} />
        </Box>
    )
}

export default DraggableCard
