/**
 * TimelineRail
 *
 * The line, and the nodes standing on it:
 *
 *     ──●────────●──────────●────────●──
 *   Preferred  Required  Preferred  Required
 *     Start      Start      End        End
 *
 * It is handed the nodes that are in play rather than the mode, because a rail
 * does not care why a point exists — only that it does. That is what lets the
 * calendar reuse it later against a different reason for the same four points.
 */

import React from 'react'
import { Box } from '@mui/material'
import { TimelineNode, DOT_ROW_HEIGHT, NODE_PAD_Y } from './TimelineNode'
import type { NodeId, NodeSpec, NodeValues } from './Timeline.Nodes'

interface TimelineRailProps {
    /** The nodes in play, in the order they are drawn. */
    nodes: NodeSpec[]
    values: NodeValues
    /** The node whose pickers are on screen, if any. */
    openNode: NodeId | null
    onToggle: (id: NodeId) => void
}

export const TimelineRail: React.FC<TimelineRailProps> = ({ nodes, values, openNode, onToggle }) => (
    <Box sx={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
        {/*
            The connecting line: a strip of card laid between the first and last
            dots, which then sit on top of it.
            Each node is an equal fraction of the row, so a node's centre sits at
            (1 / count / 2) from its own edge — half a node in from each end.

            A rail needs more than one point on it, so a lone node gets no line:
            the panel does not ask for one, and the component should not draw a
            zero-length rule if something else ever does.
        */}
        {nodes.length > 1 && (
            <Box aria-hidden
                 className="card-stock-flat"
                 sx={{ position: 'absolute',
                       left: `${100 / nodes.length / 2}%`,
                       right: `${100 / nodes.length / 2}%`,
                       // 4px rather than 2: a strip of card has a thickness, and
                       // at 2px the cut edge and the face have no room to be
                       // two different things.
                       top: NODE_PAD_Y + DOT_ROW_HEIGHT / 2 - 2,
                       height: '4px' }} />
        )}

        {nodes.map(node => (
            <TimelineNode key={node.id}
                          spec={node}
                          value={values[node.id]}
                          isOpen={openNode === node.id}
                          onToggle={() => onToggle(node.id)} />
        ))}
    </Box>
)

export default TimelineRail
