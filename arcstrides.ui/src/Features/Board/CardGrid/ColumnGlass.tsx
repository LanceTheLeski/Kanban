/**
 * ColumnGlass
 *
 * The frosted glass strips the columns are made of, laid over the whole grid.
 *
 * ── Why one layer and not a background per cell ─────────────────────────────
 * A column is one strip of glass running from its name to the bottom of the
 * board, over the swimlanes' card *and* over the gaps between them, where it
 * lies on the window itself. A frosted background on each cell would give the
 * same look inside the lanes and nothing in the gaps — the columns would read
 * as stacks of separate panes rather than as strips, and the principle the
 * board is built on (lanes are card, columns are glass) would only half show.
 *
 * ── Why it lines up ──────────────────────────────────────────────────────────
 * It is laid out with the same tokens as the header row and the swimlane rows —
 * the gutter, the label width, the column width, the gap — which is how the
 * header already stays over its cells ("Every width here comes from
 * Board.Layout"). Nothing here measures anything; if a width token changes, the
 * glass moves with it.
 *
 * ── Why it is under the cards ────────────────────────────────────────────────
 * It sits at z-index 1 and each cell at 2, so a card, a drop highlight and a
 * cell's scroll bar are all above the glass and none of them is frosted. It
 * takes no pointer events, so every drag and click passes straight through it.
 *
 * Below STACK_LABEL_BELOW the labels move above their cells and there is no
 * single column axis to follow; there each cell carries a pane of its own
 * instead — see DroppableCell.
 */

import React from 'react'
import { Box } from '@mui/material'
import { BOARD_GAP, COLUMN_WIDTH, STACK_LABEL_BELOW, SWIMLANE_LABEL_WIDTH } from '../Board.Layout'
import type { Column } from '../Board.Types'

interface ColumnGlassProps {
    columns: Column[]
}

export const ColumnGlass: React.FC<ColumnGlassProps> = ({ columns }) => (
    <Box aria-hidden
         sx={{ position: 'absolute',
               inset: 0,
               zIndex: 1,
               pointerEvents: 'none',
               display: { xs: 'none', [STACK_LABEL_BELOW]: 'flex' },
               alignItems: 'stretch',
               gap: BOARD_GAP,
               px: BOARD_GAP,
               // The header row's own top padding, so the strip starts where the
               // column's name does.
               pt: 1 }}>
        {/* Where the labels are. Card, not glass — nothing is laid over them. */}
        <Box sx={{ width: SWIMLANE_LABEL_WIDTH, flexShrink: 0 }} />

        {columns.map(column => (
            <Box key={column.id}
                 className="column-glass"
                 sx={{ width: COLUMN_WIDTH, flexShrink: 0 }} />
        ))}
    </Box>
)

export default ColumnGlass
