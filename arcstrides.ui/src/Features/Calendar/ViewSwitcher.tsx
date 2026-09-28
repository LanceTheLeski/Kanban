/**
 * ViewSwitcher
 *
 * A day's ‹ and › arrows, and the name of the view between them.
 *
 * Mirrors: the row under each Blazor date's icons — a left arrow, a red "ALL"
 * button, a right arrow — which drove the carousel of that day's cards. The
 * arrows step through the day's views (see Calendar.Views) and wrap at either
 * end, as a carousel does. The name between them is a button too, and goes
 * back to All, which is what "ALL" was there for.
 *
 * The view's name is announced when it changes, so the arrows are usable
 * without seeing what they did.
 */

import React from 'react'
import { Box, ButtonBase, IconButton } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { DayView } from './Calendar.Views'

interface ViewSwitcherProps {
    views: DayView[]
    current: number
    onChange: (index: number) => void
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ views, current, onChange }) => {
    const count = views.length
    const step = (by: number) => onChange((current + by + count) % count)
    const single = count < 2

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, minWidth: 0 }}>
            <IconButton size="small"
                        onClick={() => step(-1)}
                        disabled={single}
                        aria-label="Previous view"
                        sx={ARROW_SX}>
                <ChevronLeftIcon sx={{ fontSize: '0.95rem' }} />
            </IconButton>

            <ButtonBase onClick={() => onChange(0)}
                        disabled={current === 0}
                        aria-label={current === 0 ? `Showing ${views[current].label}` : `Showing ${views[current].label}. Back to All`}
                        sx={{ flex: 1,
                              minWidth: 0,
                              px: 0.5,
                              py: 0.15,
                              borderRadius: '2px',
                              '&:hover': { backgroundColor: 'arc.paperHover' } }}>
                <Box component="span"
                     aria-live="polite"
                     sx={{ fontSize: '0.6rem',
                           fontWeight: 700,
                           letterSpacing: '0.04em',
                           color: 'arc.onPaperStrong',
                           overflow: 'hidden',
                           textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap' }}>
                    {views[current].label}
                    {!single && (
                        <Box component="span" sx={{ fontWeight: 400, color: 'arc.onPaperMuted' }}>
                            {` ${current + 1}/${count}`}
                        </Box>
                    )}
                </Box>
            </ButtonBase>

            <IconButton size="small"
                        onClick={() => step(1)}
                        disabled={single}
                        aria-label="Next view"
                        sx={ARROW_SX}>
                <ChevronRightIcon sx={{ fontSize: '0.95rem' }} />
            </IconButton>
        </Box>
    )
}

export default ViewSwitcher

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * Small pieces of card, like "+ New task": a control on a card ground is cut
 * from card. Faded when there is only one view to be on.
 */
const ARROW_SX = {
    p: 0.1,
    flexShrink: 0,
    borderRadius: '2px',
    color: 'arc.onPaper',
    '&:hover': { backgroundColor: 'arc.paperHover' },
    '&.Mui-disabled': { color: 'arc.onPaperMuted', opacity: 0.4 },
} as const
