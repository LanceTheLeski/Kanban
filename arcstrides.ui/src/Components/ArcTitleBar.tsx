/**
 * ArcTitleBar
 *
 * The heading strip at the top of an overlay or popover: one piece of card,
 * dyed to say what kind of thing is being edited.
 *
 * ── What it replaces ─────────────────────────────────────────────────────────
 * Every overlay said the same word three times. CreateColumnOverlay opened with
 * `<Typography variant="h6">Add a New Column</Typography>`, then a TextField
 * with `label="Title"`, then that field's `helperText="Column Title"` — a
 * heading, a label and a caption, stacked, carrying one fact between them. Nine
 * overlays did it, and the card overlay had already dropped its own pair for
 * exactly this reason: "Card Title" under a box holding the card's title told
 * the reader nothing they could not see.
 *
 * So the field keeps a placeholder, which says the same thing in the space the
 * value will occupy and only while it is empty, and the heading moves here.
 *
 * ── Why it is a colour rather than only a word ───────────────────────────────
 * These dialogs are near-identical in shape: a title, one or two fields, a
 * Save/Discard bar. The stock colour is what tells a column overlay from a
 * swimlane overlay before you have read either of them, and it is the same
 * colour the entity carries elsewhere in the app.
 */

import React from 'react'
import { Box, Typography } from '@mui/material'

/** Which stock the strip is cut from. Mirrors the .paper-* classes. */
export type TitleStock = 'cream' | 'blue' | 'red' | 'green' | 'yellow'

interface ArcTitleBarProps {
    children: React.ReactNode
    stock?: TitleStock
    /** A second line, for anything the title alone cannot carry. */
    caption?: React.ReactNode
}

export const ArcTitleBar: React.FC<ArcTitleBarProps> = ({ children, stock = 'cream', caption }) => (
    /*
       A chip, not a bar. Full width, a heading is a strip of card with the title
       in one corner and six inches of nothing after it — and on the task popover,
       where the title is one word, that was most of the piece.

       Left-aligned rather than centred: a label on the corner of a folder is
       where a label goes, and it lines the heading up with the fields under it.
    */
    <Box className={`card-stock${stock === 'cream' ? '' : ` paper-${stock}`}`}
         sx={{ flexShrink: 0, alignSelf: 'flex-start', maxWidth: '100%', px: 1, py: 0.35 }}>
        <Typography component="h2"
                    sx={{ fontSize: '0.78rem',
                          fontWeight: 700,
                          // Sentence case. Letterspaced caps is signage, and these
                          // are captions on pieces of card.
                          letterSpacing: '0.01em',
                          color: 'arc.onPaperStrong' }}>
            {children}
        </Typography>

        {caption && (
            <Typography sx={{ fontSize: '0.62rem', color: 'arc.onPaperMuted', lineHeight: 1.4 }}>
                {caption}
            </Typography>
        )}
    </Box>
)

export default ArcTitleBar
