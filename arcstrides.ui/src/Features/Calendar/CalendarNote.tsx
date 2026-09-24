/**
 * CalendarNote
 *
 * A card, as it sits on a day of the month.
 *
 * Mirrors: the per-card MudPaper in CalendarDate.razor — a bright blue strip
 * (#0F83DB) holding the card's title and, under it, every one of its tasks as a
 * gold row with its own popover.
 *
 * ── Why it is a note ─────────────────────────────────────────────────────────
 * It is the same card the board pins up, so it is cut from the same paper. A
 * blue strip here and a yellow note there made one thing look like two, and the
 * blue was the loudest colour on a page whose ground is already a blue sky.
 *
 * ── Why the tasks became a tally ─────────────────────────────────────────────
 * A day on a seven-wide grid is about 150px across. The Blazor cell answered
 * that with an 18px carousel of boards, three cards per board, each card
 * listing its tasks in xx-small type — and still overflowed into a scrollbar.
 * The task list belongs to the card, which is one press away; what is worth
 * knowing from across the month is how far along it is, and that fits in four
 * characters.
 */

import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { MONO } from '../../Styles/Fonts'
import type { Card } from '../../Entities/Card/Card.Types'

interface CalendarNoteProps {
    card: Card
    onOpen: () => void
    /** Wider notes in the day overlay; the grid's are one line. */
    size?: 'small' | 'medium'
}

export const CalendarNote: React.FC<CalendarNoteProps> = ({ card, onOpen, size = 'small' }) => {
    const total = card.tasks.length
    const done = card.tasks.filter(task => task.isCompleted).length
    const medium = size === 'medium'
    const label = total > 0 ? `Open card ${card.title}, ${done} of ${total} tasks done` : `Open card ${card.title}`

    return (
        <ButtonBase className="note"
                    onClick={onOpen}
                    aria-label={label}
                    sx={{ width: '100%',
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 0.5,
                          px: medium ? 1 : 0.6,
                          py: medium ? 0.75 : 0.35,
                          textAlign: 'left',
                          transition: 'transform .12s',
                          '&:hover': { transform: 'translateY(-1px)' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
            {/*
                Two lines, then an ellipsis — the board card's rule. One line
                was enough at full width and cut "Audit the swimlane merge" to
                "Audit the s…" on a tablet, which says nothing about the card.
            */}
            <Typography sx={{ fontSize: medium ? '0.8rem' : '0.66rem',
                              fontWeight: 600,
                              lineHeight: 1.35,
                              minWidth: 0,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              overflowWrap: 'anywhere' }}>
                {card.title || 'Untitled'}
            </Typography>

            {total > 0 && (
                <Box component="span"
                     sx={{ flexShrink: 0,
                           fontFamily: MONO,
                           fontSize: medium ? '0.7rem' : '0.58rem',
                           // Finished is the one state worth a colour: the
                           // rest is ink, the same as the title.
                           color: done === total ? 'arc.paperAccent' : 'arc.onPaperMuted' }}>
                    {done}/{total}
                </Box>
            )}
        </ButtonBase>
    )
}

export default CalendarNote
