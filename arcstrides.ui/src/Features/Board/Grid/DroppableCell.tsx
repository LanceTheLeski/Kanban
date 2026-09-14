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
import {
    BOARD_GAP,
    CELL_MAX_HEIGHT,
    CELL_MIN_HEIGHT,
    COLUMN_WIDTH,
} from '../Board.Layout'

interface DroppableCellProps {
    identifier: string
    cardCount: number
    children: React.ReactNode
}

export const DroppableCell: React.FC<DroppableCellProps> = ({
    identifier,
    cardCount,
    children,
}) => {
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

    // dnd-kit needs the node and so do we, so the ref sets both.
    const attachRef = (node: HTMLDivElement | null) => {
        cellRef.current = node
        setNodeRef(node)
    }

    return (
        <Box
            ref={attachRef}
            /*
               The callback form, because `outline` is a shorthand and sx does not
               resolve palette paths in shorthands — `outline: '2px solid arc.x'`
               would be written to the DOM verbatim and do nothing. backgroundColor
               below could take the path form; it reads off the theme here so both
               colours in this block come from the same place.
            */
            sx={theme => ({
                // Width comes from the column token so this cell and the header
                // above it cannot disagree. Height is a floor and a ceiling: the
                // cell grows with its cards up to a point, then scrolls, so one
                // busy intersection cannot push the rest of the board off screen.
                width: COLUMN_WIDTH,
                minHeight: CELL_MIN_HEIGHT,
                maxHeight: CELL_MAX_HEIGHT,
                overflowY: 'auto',
                backgroundColor: isOver ? theme.palette.arc.cellActive : theme.palette.arc.cell,
                display: 'flex',
                flexDirection: 'column',
                gap: BOARD_GAP,
                p: BOARD_GAP,
                // px, not rem: a focus ring is chrome. Thickening it with the
                // reader's font size makes it heavier, not clearer.
                outline: `2px solid ${isOver ? theme.palette.arc.cellActiveEdge : 'transparent'}`,
                transition: 'background-color 0.15s, outline 0.15s',
            })}
        >
            {/*
                Only shown when cards are actually out of sight. A cell that
                silently hides its fourth card is worse than one that grows: the
                count is the difference between "three cards here" and "three of
                five". Sticky so it stays put while the cell scrolls.
            */}
            {isScrolling && (
                <Typography
                    variant="caption"
                    sx={{
                        position: 'sticky',
                        top: 0,
                        alignSelf: 'flex-end',
                        flexShrink: 0,
                        zIndex: 1,
                        px: 0.75,
                        borderRadius: 1,
                        backgroundColor: 'arc.overflowBadge',
                        color: 'common.white',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                    }}
                >
                    {cardCount} cards
                </Typography>
            )}

            {children}
        </Box>
    )
}

export default DroppableCell
