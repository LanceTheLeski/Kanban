/**
 * SwimlaneRow
 *
 * One swimlane: its name, then a drop cell for each column.
 *
 * Mirrors the per-swimlane MudPaper block from Board.razor.
 *
 * ── Why this takes props rather than reading the store ───────────────────────
 * The rule in this folder: a component about *the board* reads the store, a
 * component about *one* swimlane, column or card takes props. CardGrid is the
 * former and subscribes once; everything below it is the latter.
 *
 * That keeps the leaves independent of where the data came from — they can be
 * rendered with a literal for a test or a story — without prop-drilling, because
 * the drilling only ever goes one level.
 */

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { CONDENSED } from '../../../Styles/Fonts'
import { BOARD_GAP, STACK_LABEL_BELOW, SWIMLANE_LABEL_WIDTH } from '../Board.Layout'
import { DroppableCell } from './DroppableCell'
import { DraggableCard } from './DraggableCard'
import { cellId } from './CardGrid.Cells'
import type { Card } from '../../../Entities/Card/Card.Types'
import type { Column, Swimlane } from '../Board.Types'

interface SwimlaneRowProps {
    swimlane: Swimlane
    columns: Column[]
    cardsByCell: Map<string, Card[]>
    boardId: string
}

export const SwimlaneRow: React.FC<SwimlaneRowProps> = ({
    swimlane,
    columns,
    cardsByCell,
    boardId,
}) => (
    // Mirrors: MudPaper Style="background-color: wheat"
    <Box sx={{ backgroundColor: 'arc.swimlaneBand' }}>
        <Paper elevation={0}
               sx={{ backgroundColor: 'arc.swimlaneSurface',
                     // px, and the shorthand split so borderColor can take a palette
                     // path: sx resolves colour paths in `borderColor`, never inside
                     // the `borderLeft` shorthand. A gutter is chrome — it should not
                     // widen with the reader's font size.
                     borderLeft: '5px solid',
                     borderRight: '5px solid',
                     borderColor: 'arc.swimlaneBand' }}>
            {/*
                Wide screens put the label beside the cells; below
                STACK_LABEL_BELOW it moves above them, because a 76px label plus a
                232px column leaves nothing for either.
            */}
            <Box sx={{ display: 'flex',
                       flexDirection: { xs: 'column', [STACK_LABEL_BELOW]: 'row' },
                       alignItems: 'stretch',
                       gap: BOARD_GAP,
                       p: BOARD_GAP }}>
                {/* Mirrors: MudPaper Width="110px" Style="background-color: lightcoral" */}
                <Paper sx={{ // Spread, not nested. SWIMLANE_LABEL_WIDTH is itself a
                             // breakpoint map, so `{ [STACK_LABEL_BELOW]: SWIMLANE_LABEL_WIDTH }`
                             // would hand MUI a map as a *value*; it cannot resolve that,
                             // drops the entry silently, and `xs: '100%'` then cascades to
                             // every width — which is exactly what made this label 1170px
                             // wide and shoved the cells off the board. Spreading merges the
                             // token's own sm/md entries in as siblings; the trailing
                             // `xs: '100%'` overrides the token's xs for the stacked case.
                             width: { ...SWIMLANE_LABEL_WIDTH, xs: '100%' },
                             flexShrink: 0,
                             alignSelf: { xs: 'stretch', [STACK_LABEL_BELOW]: 'center' },
                             backgroundColor: 'arc.swimlaneLabel',
                             // The page root sets textAlign: 'center', which inherits all
                             // the way down here and positions the inline-block label. It
                             // has to be overridden on this box, not on the Typography:
                             // text-align positions an inline-block from its *parent*.
                             textAlign: { xs: 'left', [STACK_LABEL_BELOW]: 'center' },
                             px: 1,
                             py: 0.5 }}>
                    {/*
                        Stacked, the label bar spans the board's full scroll width —
                        978px at 420px wide — so centred text lands near x=489 and is
                        simply off screen. Left-aligning it puts the name back at the
                        edge you are looking at.

                        `sticky` then keeps it there: scroll the row sideways and the
                        swimlane name rides along the left edge instead of
                        disappearing, which matters most on exactly the narrow screens
                        where the label had to stack.
                    */}
                    <Typography sx={{ fontFamily: CONDENSED,
                                      fontSize: 'small',
                                      fontWeight: 'bold',
                                      color: 'black',
                                      overflowWrap: 'anywhere',
                                      position: { xs: 'sticky', [STACK_LABEL_BELOW]: 'static' },
                                      left: 0,
                                      display: 'inline-block' }}>
                        {swimlane.title}
                    </Typography>
                </Paper>

                {/*
                    Drop cells. They stretch to the height of the tallest in the
                    row, so a row is as tall as its fullest cell rather than a fixed
                    250px that clipped anything beyond it.
                */}
                <Box sx={{ display: 'flex', gap: BOARD_GAP, alignItems: 'stretch' }}>
                    {columns.map(column => {
                        const identifier = cellId(swimlane.id, column.id)
                        const cellCards = cardsByCell.get(identifier) ?? []

                        return (
                            <DroppableCell key={column.id}
                                           identifier={identifier}
                                           cardIds={cellCards.map(card => card.id)}>
                                {cellCards.map(card => (
                                    <DraggableCard key={card.id} card={card} boardId={boardId} />
                                ))}
                            </DroppableCell>
                        )
                    })}
                </Box>
            </Box>
        </Paper>
    </Box>
)

export default SwimlaneRow
