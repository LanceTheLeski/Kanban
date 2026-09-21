/**
 * ArcSplitPane
 *
 * Two panes with a bar between them that the reader can drag.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * The card overlay divided itself 4:7 between the card's detail and its
 * description, and that ratio was a guess baked into the layout. It is the wrong
 * guess about half the time: a card that is a checklist wants almost all of the
 * room for its tasks, and a card that is a piece of writing wants it for the
 * description. Neither can say so.
 *
 * The split is now a number the reader sets by dragging, and a number is exactly
 * the kind of thing that can later be stored on the card. Nothing here persists
 * yet — see the note in UpdateCardOverlay — but the component is written
 * controlled, so persisting it is a matter of passing a different value in and
 * saving what comes out.
 *
 * ── Minimums are in rem ──────────────────────────────────────────────────────
 * Both panes hold text, so their floors grow with the reader's font size, like
 * everything else measured in this app. That is also why the clamp is computed
 * against the live root font size rather than a constant: at a 24px root, a
 * 22rem minimum is 528px, and a clamp that assumed 352px would let the pane
 * shrink past the point its content fits.
 *
 * ── Collapsing ───────────────────────────────────────────────────────────────
 * Pulled far enough right, the right pane goes away entirely rather than
 * stopping at its minimum. A card that is only tasks should be able to say so,
 * and a pane squeezed to a useless sliver is worse than one that is gone. It
 * snaps back out when the bar is dragged left again, and the bar stays visible
 * and draggable while collapsed so there is always a way back.
 *
 * ── Accessibility ────────────────────────────────────────────────────────────
 * The bar is a `separator` with a value, which is the role ARIA defines for
 * exactly this and which makes it focusable and operable from the keyboard:
 * arrows nudge, Home and End go to the extremes, Enter toggles the collapse.
 * A drag-only splitter is unusable without a pointer.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, type Breakpoint } from '@mui/material'

// ── Geometry ──────────────────────────────────────────────────────────────────

/** The bar's hit area. Wider than the line it draws, because 2px is not a target. */
const BAR_WIDTH = 11

/** Past this share, the right pane is dropped rather than shown as a sliver. */
const COLLAPSE_AT = 0.97

/** How far one arrow key moves the split. */
const KEY_STEP = 0.02

export interface ArcSplitPaneProps {
    /** The left pane's share of the width, 0..1. */
    ratio: number
    onRatioChange: (ratio: number) => void

    left: React.ReactNode
    right: React.ReactNode

    /** Floors, in rem, so they grow with the root font size. */
    minLeftRem: number
    minRightRem: number

    /** Lets the right pane be dragged away entirely. */
    collapsibleRight?: boolean

    /** Below this the panes stack and the bar is not rendered. */
    stackBelow?: Breakpoint

    /** Restores this ratio on a double-click. */
    resetRatio?: number

    label?: string
}

export const ArcSplitPane: React.FC<ArcSplitPaneProps> = ({
    ratio,
    onRatioChange,
    left,
    right,
    minLeftRem,
    minRightRem,
    collapsibleRight = false,
    stackBelow = 'md',
    resetRatio,
    label = 'Resize panes',
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [dragging, setDragging] = useState(false)

    const collapsed = collapsibleRight && ratio >= COLLAPSE_AT

    /**
     * Turns a pointer position into a ratio the layout can actually honour.
     *
     * The clamp has to be recomputed per move rather than held as a constant:
     * the overlay is resizable, the root font size can change, and a ratio that
     * was legal at one width is not at another.
     */
    const ratioFromClientX = useCallback((clientX: number): number => {
        const container = containerRef.current
        if (!container) return ratio

        const bounds = container.getBoundingClientRect()
        const usable = bounds.width - BAR_WIDTH
        if (usable <= 0) return ratio

        const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
        const minLeft = (minLeftRem * rootPx) / usable
        const minRight = (minRightRem * rootPx) / usable

        const raw = (clientX - bounds.left - BAR_WIDTH / 2) / usable

        // Past the last legal position, snap to gone rather than to a sliver.
        if (collapsibleRight && raw > 1 - minRight / 2) return 1

        return Math.min(Math.max(raw, minLeft), Math.max(minLeft, 1 - minRight))
    }, [ratio, minLeftRem, minRightRem, collapsibleRight])

    // Pointer capture keeps the drag alive when the cursor leaves the bar, which
    // it always does — the bar is 11px wide and the gesture is 400px long.
    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return
        event.preventDefault()
        onRatioChange(ratioFromClientX(event.clientX))
    }

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
        setDragging(false)
    }

    // While dragging, the whole document takes the resize cursor and stops
    // selecting text — otherwise the gesture highlights the description it is
    // resizing, and the cursor flickers whenever it is over a pane rather than
    // the bar.
    useEffect(() => {
        if (!dragging) return
        const previousCursor = document.body.style.cursor
        const previousSelect = document.body.style.userSelect
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
        return () => {
            document.body.style.cursor = previousCursor
            document.body.style.userSelect = previousSelect
        }
    }, [dragging])

    const nudge = (delta: number) => {
        const container = containerRef.current
        if (!container) return
        const bounds = container.getBoundingClientRect()
        onRatioChange(ratioFromClientX(bounds.left + BAR_WIDTH / 2 + (ratio + delta) * (bounds.width - BAR_WIDTH)))
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case 'ArrowLeft': event.preventDefault(); return nudge(-KEY_STEP)
            case 'ArrowRight': event.preventDefault(); return nudge(KEY_STEP)
            case 'Home': event.preventDefault(); return onRatioChange(ratioFromClientX(-Infinity))
            case 'End': event.preventDefault(); return onRatioChange(collapsibleRight ? 1 : ratioFromClientX(Infinity))
            case 'Enter':
            case ' ':
                if (!collapsibleRight) return
                event.preventDefault()
                return onRatioChange(collapsed ? (resetRatio ?? 0.5) : 1)
            default:
        }
    }

    return (
        <Box ref={containerRef}
             sx={{ display: 'grid',
                   // Stacked, there is one column and the bar is not rendered at all:
                   // a horizontal split has no meaning when the panes are above and
                   // below each other.
                   gridTemplateColumns: {
                       xs: '1fr',
                       [stackBelow]: collapsed
                           ? `minmax(0, 1fr) ${BAR_WIDTH}px 0px`
                           : `minmax(0, ${ratio}fr) ${BAR_WIDTH}px minmax(0, ${1 - ratio}fr)`,
                   },
                   gap: { xs: 2, [stackBelow]: 0 },
                   alignItems: 'stretch',
                   // Fills the container it is given rather than sizing to its
                   // panes: both of them scroll their own content, so sizing to
                   // content means neither ever reaches the height the row has.
                   // Harmless when the parent is not a flex column.
                   flex: 1,
                   minHeight: 0 }}>
            <Box sx={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {left}
            </Box>

            {/* ── The bar ──────────────────────────────────────────────────── */}
            <Box role="separator"
                 aria-orientation="vertical"
                 aria-label={label}
                 aria-valuenow={Math.round(ratio * 100)}
                 aria-valuemin={0}
                 aria-valuemax={100}
                 tabIndex={0}
                 onPointerDown={handlePointerDown}
                 onPointerMove={handlePointerMove}
                 onPointerUp={endDrag}
                 onPointerCancel={endDrag}
                 onKeyDown={handleKeyDown}
                 onDoubleClick={() => resetRatio !== undefined && onRatioChange(resetRatio)}
                 sx={{ display: { xs: 'none', [stackBelow]: 'flex' },
                       position: 'relative',
                       alignItems: 'center',
                       justifyContent: 'center',
                       cursor: 'col-resize',
                       // The gesture is horizontal, so the browser must not claim it
                       // for scrolling on a touch device.
                       touchAction: 'none',
                       outline: 'none',
                       '&:focus-visible .arc-split-grip': { backgroundColor: 'arc.accentOnGlass' } }}>
                {/*
                    A hairline with a handle on it.

                    The line alone reads as a border between two things; the
                    handle is what says "take hold of this". They are two elements
                    rather than one with a ::after, because the first attempt drew
                    the notches with a box-shadow in `currentColor` — which
                    inherits the *text* colour, so a light bar came out with dark
                    marks stamped on it.
                */}
                <Box className="arc-split-grip"
                     sx={{ position: 'absolute',
                           width: 3,
                           height: collapsed ? '100%' : '92%',
                           borderRadius: 999,
                           backgroundColor: dragging ? 'arc.accentOnGlass' : 'arc.railLine',
                           transition: 'background-color .12s',
                           '*:hover > &': { backgroundColor: 'arc.onGlass' } }} />

                <Box sx={{ position: 'relative',
                           width: 7,
                           height: 34,
                           borderRadius: 999,
                           backgroundColor: dragging ? 'arc.accentOnGlass' : 'arc.onGlassMuted',
                           boxShadow: '0 1px 3px rgba(0,0,0,.35)',
                           transition: 'background-color .12s',
                           '*:hover > &': { backgroundColor: 'arc.onGlassStrong' } }} />
            </Box>

            {/*
                Kept mounted while collapsed rather than unmounted: the description
                is a draft the reader may have typed into, and dragging the bar
                past a threshold is not a decision to discard it.
            */}
            <Box sx={{ minWidth: 0,
                       minHeight: 0,
                       display: collapsed ? 'none' : 'flex',
                       flexDirection: 'column' }}>
                {right}
            </Box>
        </Box>
    )
}

export default ArcSplitPane
