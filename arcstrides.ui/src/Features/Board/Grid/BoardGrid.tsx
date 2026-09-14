/**
 * BoardGrid
 *
 * The scrolling grid: the column headers, a row per swimlane, and the drag
 * context that ties them together.
 *
 * Mirrors <MudDropContainer> and the two blocks Board.razor rendered inside it.
 *
 * This is the one component in the folder that reads the store — see the note in
 * SwimlaneRow for why the rest take props.
 */

import React, { useMemo } from 'react'
import { Box } from '@mui/material'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../Board.Store'
import { BoardCard } from '../BoardCard'
import { ColumnHeaderRow } from './ColumnHeaderRow'
import { SwimlaneRow } from './SwimlaneRow'
import { groupCardsByCell } from './Board.Cells'
import { useCardDrag } from './useCardDrag'

interface BoardGridProps {
    boardId: string
}

export const BoardGrid: React.FC<BoardGridProps> = ({ boardId }) => {
    const { columns, swimlanes, cards } = useBoardStore(
        useShallow(state => ({
            columns: state.columns,
            swimlanes: state.swimlanes,
            cards: state.cards,
        })),
    )

    const { sensors, draggingCard, handleDragStart, handleDragEnd, handleDragCancel } =
        useCardDrag(boardId)

    const cardsByCell = useMemo(() => groupCardsByCell(cards), [cards])

    return (
        /*
            The grid scrolls sideways as a unit so the column headers stay lined up
            with the cells beneath them — the header row and the swimlane rows are
            the same width and share one horizontal scroll container.
        */
        <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', minWidth: '100%' }}>
                <ColumnHeaderRow columns={columns} />

                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    {swimlanes.map(swimlane => (
                        <SwimlaneRow
                            key={swimlane.id}
                            swimlane={swimlane}
                            columns={columns}
                            cardsByCell={cardsByCell}
                            boardId={boardId}
                        />
                    ))}

                    {/*
                        The card that follows the cursor mid-drag. MudDropZone drew
                        this for us; dnd-kit needs it declared explicitly.
                    */}
                    <DragOverlay>
                        {draggingCard && <BoardCard card={draggingCard} boardId={boardId} preview />}
                    </DragOverlay>
                </DndContext>
            </Box>
        </Box>
    )
}

export default BoardGrid
