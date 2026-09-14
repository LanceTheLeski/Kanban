/**
 * ColumnHeaderRow
 *
 * The strip of column titles above the grid, with the board's name at its left
 * where the swimlane labels begin.
 *
 * Every width here comes from Board.Layout, so a header stays over its cells.
 * Nothing in this file may state a width of its own.
 */

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import {
    BOARD_GAP,
    BOARD_TITLE_WIDTH,
    COLUMN_WIDTH,
    STACK_LABEL_BELOW,
} from '../Board.Layout'
import type { Column } from '../Board.Types'

interface ColumnHeaderRowProps {
    columns: Column[]
}

export const ColumnHeaderRow: React.FC<ColumnHeaderRowProps> = ({ columns }) => (
    <Box
        sx={{
            // Hidden below the label breakpoint, where the swimlane label moves
            // above its row and there is no longer a single header row that lines
            // up with anything.
            display: { xs: 'none', [STACK_LABEL_BELOW]: 'flex' },
            alignItems: 'center',
            gap: BOARD_GAP,
            px: BOARD_GAP,
            py: 1,
        }}
    >
        {/* "Honu Boards" — mirrors Blazor's Freestyle Script styled MudText */}
        <Paper
            elevation={0}
            sx={{
                width: BOARD_TITLE_WIDTH,
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <Typography
                sx={{
                    fontFamily: "'Freestyle Script', cursive",
                    fontWeight: 'bold',
                    fontSize: '1.6rem',
                    color: 'arc.boardTitle',
                    lineHeight: 1.1,
                }}
            >
                Honu Boards
            </Typography>
        </Paper>

        {columns.map(column => (
            <Paper
                key={column.id}
                sx={{
                    width: COLUMN_WIDTH,
                    // rem, not 40: this floor exists to hold one line of the
                    // title, so it has to grow with it.
                    minHeight: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    px: 1,
                    py: 0.5,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: "'Calibri Condensed', 'Bodoni MT Condensed', 'Bahnschrift Light Condensed', sans-serif",
                        fontSize: 'small',
                        fontWeight: 'bold',
                        color: 'black',
                        // Column names are user-written; let a long one wrap
                        // rather than clip, since the header grows to fit.
                        textAlign: 'center',
                        overflowWrap: 'anywhere',
                    }}
                >
                    {column.title}
                </Typography>
            </Paper>
        ))}
    </Box>
)

export default ColumnHeaderRow
