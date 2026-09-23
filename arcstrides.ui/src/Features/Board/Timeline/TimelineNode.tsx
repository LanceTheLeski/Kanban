/**
 * TimelineNode
 *
 * One point on the rail: a dot, a two-word label, and what the point is set to.
 *
 * Filled means it has a date and hollow means it does not. That distinction is
 * the entire reason the rail exists — it is what lets you read "what is
 * scheduled here" without reading anything — so it lives in the smallest piece
 * rather than in whatever happens to draw the line.
 *
 * ── The dot is the button ────────────────────────────────────────────────────
 * It used to be the whole node — dot, label and date in one ButtonBase a
 * quarter of the rail wide. So the thing you could press had no visible edge:
 * hovering the word "Start" three lines under a dot lit up a region nobody could
 * see the shape of, the opened node wore a raised box that looked like a
 * different control, and the tooltip anchored to that invisible region pointed
 * at the wrong place. Now the boundary you can press is the circle you can see.
 * The label and date under it are text.
 */

import React from 'react'
import { Box, ButtonBase, Tooltip, Typography } from '@mui/material'
import { MONO } from '../../../Styles/Fonts'
import type { NodeSpec, NodeValue } from './Timeline.Nodes'

// ── Geometry ──────────────────────────────────────────────────────────────────
// Exported because TimelineRail has to put its connector through the middle of
// these dots. Reading the node's own numbers is what stopped the line landing
// 2.3px above the dots it is meant to join; a second copy of them would drift
// apart again the first time one was tuned.

/**
 * 16, up from 13, now that the dot is the whole target. Still under the 24px a
 * pointer target ideally gets; the rail has four of these across a column, and
 * at 24 they stop reading as points on a line and start reading as buttons in a
 * row. The label under each is not pressable — see above — so the dot is what
 * keyboard focus lands on, with a visible ring.
 */
export const DOT = 16
export const DOT_ROW_HEIGHT = 22
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
    const name = spec.label.join(' ')

    return (
        <Box sx={{ flex: 1,
                   minWidth: 0,
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   pt: `${NODE_PAD_Y}px`,
                   pb: 0.25 }}>
            <Box sx={{ height: DOT_ROW_HEIGHT,
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       // Above the rail, so the strip runs under the discs.
                       zIndex: 1 }}>
                {/*
                    describeChild, because MUI's Tooltip defaults to acting as the
                    child's accessible *label* — and the label here is the node's
                    name, which is what a screen reader and a test both look it
                    up by. The meaning rides along as a description instead.
                */}
                <Tooltip title={spec.meaning} placement="top" describeChild>
                    {/*
                        A disc punched from card and glued to the rail: deep blue
                        when it has a date, greyboard when it does not. Opened, it
                        stands up off the rail — card-stock rather than glued, so
                        it picks up a shadow — and grows a little; that is the
                        whole of the "this one" signal, with no ring round it.
                    */}
                    <ButtonBase onClick={onToggle}
                                aria-pressed={isOpen}
                                aria-label={name}
                                disableRipple
                                className={`card-disc ${isOpen ? 'card-stock' : 'card-stock-glued'} ${isSet ? 'paper-ink' : 'paper-grey'}`}
                                sx={{ width: DOT,
                                      height: DOT,
                                      borderRadius: '50%',
                                      transform: isOpen ? 'scale(1.3)' : 'none',
                                      transition: 'transform .12s',
                                      '&:hover': { transform: isOpen ? 'scale(1.3)' : 'scale(1.18)' },
                                      '&.Mui-focusVisible': { outline: '2px solid',
                                                              outlineColor: 'arc.paperAccent',
                                                              outlineOffset: '2px' } }} />
                </Tooltip>
            </Box>

            {/* The name — text, not part of the target. */}
            <Typography aria-hidden
                        sx={{ fontSize: '0.55rem',
                              lineHeight: 1.25,
                              textAlign: 'center',
                              mt: 0.25,
                              color: isOpen ? 'arc.onPaperStrong' : 'arc.onPaperMuted',
                              fontWeight: isOpen ? 700 : 400 }}>
                {spec.label[0]}
                <br />
                {spec.label[1]}
            </Typography>

            {/* What it is set to. */}
            <Typography sx={{ fontFamily: MONO,
                              fontSize: '0.58rem',
                              lineHeight: 1.4,
                              textAlign: 'center',
                              color: isSet ? 'arc.onPaper' : 'arc.onPaperMuted',
                              fontWeight: isOpen ? 700 : 400,
                              whiteSpace: 'nowrap' }}>
                {value.date ? value.date.format('DD MMM') : '—'}
                {value.time && (
                    <>
                        <br />
                        {value.time.format('HH:mm')}
                    </>
                )}
            </Typography>
        </Box>
    )
}

export default TimelineNode
