/**
 * TimelineNode
 *
 * One point on the rail: a dot, a two-word label, and what the point is set to.
 *
 * Filled means it has a date and hollow means it does not. That distinction is
 * the entire reason the rail exists — it is what lets you read "what is
 * scheduled here" without reading anything — so it lives in the smallest piece
 * rather than in whatever happens to draw the line.
 */

import React from 'react'
import { Box, ButtonBase, Tooltip, Typography } from '@mui/material'
import type { NodeSpec, NodeValue } from './Timeline.Nodes'

// ── Geometry ──────────────────────────────────────────────────────────────────
// Exported because TimelineRail has to put its connector through the middle of
// these dots. Reading the node's own numbers is what stopped the line landing
// 2.3px above the dots it is meant to join; a second copy of them would drift
// apart again the first time one was tuned.

export const DOT = 13
export const DOT_ROW_HEIGHT = 18
/** The node's top padding, which the connector is positioned against. */
export const NODE_PAD_Y = 2

interface TimelineNodeProps {
    spec: NodeSpec
    value: NodeValue
    /** Whether this is the node whose pickers are on screen. */
    isOpen: boolean
    onToggle: () => void
}

export const TimelineNode: React.FC<TimelineNodeProps> = ({ spec, value, isOpen, onToggle }) => {
    const isSet = Boolean(value.date)

    /*
       describeChild, because MUI's Tooltip defaults to acting as the child's
       accessible *label*. Without it this button announced "When this would
       ideally be finished" instead of "Preferred End", and the node's own text
       was unreachable both to a screen reader and to any test looking a control
       up by name. As a description it sits alongside the name instead.
    */
    return (
        <Tooltip title={spec.meaning} placement="top" describeChild>
            <ButtonBase onClick={onToggle}
                        aria-pressed={isOpen}
                        sx={{ flex: 1,
                              minWidth: 0,
                              flexDirection: 'column',
                              borderRadius: 1,
                              pt: `${NODE_PAD_Y}px`,
                              pb: 0.25,
                              '&:hover': { backgroundColor: 'arc.glassHover' } }}>

                {/* Dot */}
                <Box sx={{ height: DOT_ROW_HEIGHT,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           zIndex: 1 }}>
                    <Box sx={{ width: DOT,
                               height: DOT,
                               borderRadius: '50%',
                               border: '2px solid',
                               borderColor: isOpen ? 'arc.accentOnGlass' : 'arc.onGlass',
                               // An unset dot is hollow, but it still has to sit
                               // *on* the rail rather than let the line run
                               // through it — hence a fill either way, and only
                               // the colour saying which it is.
                               backgroundColor: isSet ? 'arc.accentOnGlass' : 'arc.railNodeEmpty',
                               boxShadow: isOpen
                                   ? '0 0 0 3px rgba(154,217,255,.35)'
                                   : '0 0 0 2px rgba(30,41,59,.35)' }} />
                </Box>

                {/* Label */}
                <Typography sx={{ fontSize: '0.55rem',
                                  lineHeight: 1.25,
                                  textAlign: 'center',
                                  color: isOpen ? 'arc.onGlassStrong' : 'arc.onGlassMuted',
                                  fontWeight: isOpen ? 700 : 400 }}>
                    {spec.label[0]}
                    <br />
                    {spec.label[1]}
                </Typography>

                {/* What it is set to */}
                <Typography sx={{ fontFamily: '"DM Mono", ui-monospace, monospace',
                                  fontSize: '0.58rem',
                                  lineHeight: 1.4,
                                  textAlign: 'center',
                                  color: isSet ? 'arc.onGlass' : 'arc.onGlassMuted',
                                  whiteSpace: 'nowrap' }}>
                    {value.date ? value.date.format('DD MMM') : '—'}
                    {value.time && (
                        <>
                            <br />
                            {value.time.format('HH:mm')}
                        </>
                    )}
                </Typography>
            </ButtonBase>
        </Tooltip>
    )
}

export default TimelineNode
