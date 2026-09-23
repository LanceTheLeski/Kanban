/**
 * DroppableCell
 *
 * One column × swimlane intersection.
 *
 * Mirrors MudDropZone Identifier="@identifier" CanDropClass="mud-border-success".
 */

import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BOARD_GAP, CELL_MAX_HEIGHT, CELL_MIN_HEIGHT, COLUMN_WIDTH, STACK_LABEL_BELOW } from '../Board.Layout'

interface DroppableCellProps {
    identifier: string
    /** The cards in this cell, top to bottom. Sortable needs them in order. */
    cardIds: string[]
    children: React.ReactNode
}

export const DroppableCell: React.FC<DroppableCellProps> = ({ identifier, cardIds, children }) => {
    const cardCount = cardIds.length
    const { setNodeRef, isOver } = useDroppable({ id: identifier })

    // Whether the cell is actually holding more than it can show. Measured rather
    // than inferred from the card count, because cards are not a fixed height —
    // two long ones can overflow where three short ones do not.
    const cellRef = useRef<HTMLDivElement | null>(null)
    const [isScrolling, setIsScrolling] = useState(false)

    useEffect(() => {
        const cell = cellRef.current
        if (!cell) return

        const measure = () => setIsScrolling(cell.scrollHeight > cell.clientHeight + 1)
        measure()

        // Card heights settle after fonts load and text wraps, so a single
        // measurement on mount would be taken too early.
        const observer = new ResizeObserver(measure)
        observer.observe(cell)
        for (const child of cell.children) observer.observe(child)

        return () => observer.disconnect()
    }, [cardCount])

    return (
        <Box ref={attachRef}
             /*
                A seam in the wall rather than a block on it — see .board-cell.
                Nothing about a cell needs to be loud until something is held
                over it, and then it has to be unmissable, which is what
                `is-over` is for.

                The ring colour is handed over as a custom property because a
                box-shadow takes no palette path and this one lives in the
                stylesheet. It is the same trick .glass uses for its accent.
             */
             className={`board-cell${isOver ? ' is-over' : ''}`}
             sx={theme => ({
                 // Width comes from the column token so this cell and the header
                 // above it cannot disagree. Height is a floor and a ceiling: the
                 // cell grows with its cards up to a point, then scrolls, so one
                 // busy intersection cannot push the rest of the board off screen.
                 width: COLUMN_WIDTH,
                 minHeight: CELL_MIN_HEIGHT,
                 maxHeight: CELL_MAX_HEIGHT,
                 overflowY: 'auto',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: BOARD_GAP,
                 p: BOARD_GAP,
                 '--arc-cell-ring': theme.palette.arc.cellActiveEdge,
                 // Above the column's glass (z-index 1), so the cards, the drop
                 // highlight and the scroll bar are not frosted along with the
                 // lane under them.
                 position: 'relative',
                 zIndex: 2,
                 borderRadius: '4px',
                 // Stacked, there is no column axis for ColumnGlass to follow, so
                 // the cell carries its own pane of the same glass instead.
                 backgroundColor: { xs: 'rgba(255, 255, 255, 0.3)', [STACK_LABEL_BELOW]: 'transparent' },
             })}>

            {/*
                Only shown when cards are actually out of sight. A cell that
                silently hides its fourth card is worse than one that grows: the
                count is the difference between "three cards here" and "three of
                five". Sticky so it stays put while the cell scrolls.
            */}
            {isScrolling && (
                <Typography variant="caption"
                            sx={{ position: 'sticky',
                                  top: 0,
                                  alignSelf: 'flex-end',
                                  flexShrink: 0,
                                  zIndex: 1,
                                  px: 0.75,
                                  borderRadius: 1,
                                  backgroundColor: 'arc.overflowBadge',
                                  color: 'common.white',
                                  fontWeight: 'bold',
                                  pointerEvents: 'none' }}>
                    {cardCount} cards
                </Typography>
            )}

            {/*
                The cell is a drop target in its own right — for the empty space
                below the cards — and SortableContext makes each card one too, so
                a drop can say *where* in the cell rather than only *which*.
            */}
            <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </Box>
    )

    /** dnd-kit needs the node and so do we, so the ref sets both. */
    function attachRef(node: HTMLDivElement | null) {
        cellRef.current = node
        setNodeRef(node)
    }
}

export default DroppableCell
