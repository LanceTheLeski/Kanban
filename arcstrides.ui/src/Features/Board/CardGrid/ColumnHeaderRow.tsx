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
import { CONDENSED, SCRIPT } from '../../../Styles/Fonts'
import { columnColour } from '../Board.Colours'
import { glassStyle } from '../../../Styles/Stock'
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
    <Box sx={{ // Hidden below the label breakpoint, where the swimlane label moves
               // above its row and there is no longer a single header row that lines
               // up with anything.
               display: { xs: 'none', [STACK_LABEL_BELOW]: 'flex' },
               alignItems: 'center',
               gap: BOARD_GAP,
               px: BOARD_GAP,
               py: 1 }}>
        {/* "Honu Boards" — mirrors Blazor's Freestyle Script styled MudText */}
        <Paper elevation={0}
               sx={{ width: BOARD_TITLE_WIDTH,
                     backgroundColor: 'transparent',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     flexShrink: 0 }}>
            <Typography sx={{ fontFamily: SCRIPT,
                              fontWeight: 'bold',
                              fontSize: '1.6rem',
                              color: 'arc.boardTitle',
                              lineHeight: 1.1 }}>
                Honu Boards
            </Typography>
        </Paper>

        {columns.map((column, index) => (
            <Paper key={column.id}
                   className="column-cap"
                   elevation={0}
                   /*
                      The top of the column's glass strip, tinted with the column's
                      colour — its own when it has one, otherwise its place on the
                      blue ramp, palest on the left. See Board.Colours.

                      Glass, not card: this is the column's name, and the column is
                      made of glass. The swimlane labels down the left are card,
                      because the lanes are.
                   */
                   style={glassStyle(columnColour(column.colour, index, columns.length))}
                   sx={{ width: COLUMN_WIDTH,
                         // rem, not 40: this floor exists to hold one line of the
                         // title, so it has to grow with it.
                         minHeight: '2.5rem',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         flexShrink: 0,
                         // Above the strip it caps, so the name is not frosted.
                         position: 'relative',
                         zIndex: 2,
                         px: 1,
                         py: 0.5 }}>
                {/*
                    Uppercase and letterspaced, which is what a column name is:
                    a heading over a stack of things, not one of the things. The
                    condensed face stays, because the names are user-written and
                    a narrow one fits more of a long name before it wraps.
                */}
                <Typography sx={{ fontFamily: CONDENSED,
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.09em',
                                  textTransform: 'uppercase',
                                  color: 'arc.onPaperStrong',
                                  // Column names are user-written; let a long one wrap
                                  // rather than clip, since the header grows to fit.
                                  textAlign: 'center',
                                  overflowWrap: 'anywhere' }}>
                    {column.title}
                </Typography>
            </Paper>
        ))}
    </Box>
)

export default ColumnHeaderRow
