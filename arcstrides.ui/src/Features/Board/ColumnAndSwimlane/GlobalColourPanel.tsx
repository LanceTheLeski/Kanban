/**
 * GlobalColourPanel
 *
 * Under the colour picker, when the colour picked is already another column's
 * global colour: says whose, and offers this one a global colour of its own.
 *
 *   ┌ Column colour ─────────────── [#79aad8] ┐
 *   │ PAPER ▭ ▭ ▭ ▭ …                         │
 *   └─────────────────────────────────────────┘
 *   ┌ #79aad8 is already the global colour of "Done", on this board. … ┐
 *   │ Global colour ─────────────── [#5f97cc]                          │
 *   │ PAPER ▭ ▭ ▭ ▭ …                                                  │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * The board still shows the colour picked; only the global one changes. See
 * useColourChoice for the rule, and docs/api-gaps.md for where it is enforced.
 */

import React from 'react'
import { Box, Typography } from '@mui/material'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { toHex } from '../../../Styles/Stock'
import type { ColourChoice } from '../Hooks/useColourChoice'

interface GlobalColourPanelProps
{
    choice: ColourChoice

    kind: 'column' | 'swimlane'

    /** The board being edited, to say whether the holder is on it. */
    boardId: string | null
}

export const GlobalColourPanel: React.FC<GlobalColourPanelProps> = ({ choice, kind, boardId }) =>
{
    const holder = choice.takenBy
    if (!holder || !choice.colour)
        return null

    const where = holder.boardId === boardId
        ? 'on this board'
        : 'on another board'

    return (
        <Box className="card-stock paper-yellow"
             role="group"
             aria-label={`Global colour for this ${kind}`}
             sx={{ p: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'arc.onPaperStrong', lineHeight: 1.45 }}>
                { toHex(choice.colour) } is already the global colour of "{ holder.title }", { where }. A
                global colour tells one { kind } from another across boards, so this one needs its own. The
                board still shows the colour you picked.
            </Typography>

            <ArcColourPicker value={choice.override}
                             onChange={choice.setOverride}
                             fallback={choice.offered ?? choice.colour}
                             label="Global colour" />

            { choice.overrideTakenBy && (
                <Typography role="alert"
                            sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'arc.paperDanger' }}>
                    That one is "{ choice.overrideTakenBy.title }"'s global colour too.
                </Typography>
            )
            }
        </Box>
    )
}

export default GlobalColourPanel
