/**
 * BoardCard
 *
 * Mirrors: Board/BoardCard.razor
 *
 * The Blazor version had a mix of responsibilities:
 *   - Rendering the card tile (fixed 120×200px)
 *   - Managing an internal updateCardOverlayIsOpen boolean
 *   - Calling parent callbacks (OpenCardOverlayChanged, UpdateOrDeleteCardChanged)
 *     AND managing its own overlay state simultaneously
 *
 * This was inconsistent — the parent had OpenCardOverlay state but the child
 * also had updateCardOverlayIsOpen. In practice the child's local state was
 * what actually drove the overlay.
 *
 * In React we simplify: BoardCard owns and renders its own UpdateCardOverlay
 * inline (no prop drilling for overlay state up to the parent). The parent
 * just passes the DropCard down and lets the card manage its own edit flow.
 *
 * If the parent needs to know when a card was updated/deleted (e.g. to remove it
 * from its list), it can pass onUpdated/onDeleted callbacks.
 */

import React, { useState } from 'react'
import { Box, Button, ButtonGroup, Paper, Typography } from '@mui/material'
import { UpdateCardOverlay } from './Card/UpdateCardOverlay'
import type { DropCard } from '../../Types/Board.Types'

interface BoardCardProps {
    dropCard: DropCard
    boardId: string
    onUpdated?: (updated: DropCard) => void
    onDeleted?: (cardId: string) => void
}

export const BoardCard: React.FC<BoardCardProps> = ({
    dropCard,
    boardId,
    onUpdated,
    onDeleted,
}) => {
    const [updateOpen, setUpdateOpen] = useState(false)
    const { card } = dropCard

    return (
        <>
            {/* ── Card tile ─────────────────────────────────────────────────────── */}
            {/*
        Mirrors Blazor:
          MudPaper width=120px height=200px background-color=lightyellow
          MudStack AlignItems.Center
      */}
            <Paper
                sx={{
                    width: 120,
                    height: 200,
                    backgroundColor: 'lightyellow',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    textAlign: 'center',
                }}
                elevation={3}
            >
                {/* Upper section: clickable card content */}
                <Box
                    onClick={() => setUpdateOpen(true)}
                    sx={{
                        flex: 1,
                        minHeight: 160,
                        cursor: 'pointer',
                        p: 0.5,
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                    }}
                >
                    {/* Title — mirrors MudText font-weight:600 font-size:x-small */}
                    <Typography
                        sx={{
                            height: 20,
                            maxWidth: 120,
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            overflow: 'hidden',
                            textOverflow: 'clip',
                        }}
                    >
                        {card.title}
                    </Typography>

                    {/* Description — mirrors MudText height:100px font-size:x-small */}
                    <Typography
                        sx={{
                            height: 100,
                            maxWidth: 120,
                            fontSize: '0.65rem',
                            overflow: 'hidden',
                            textOverflow: 'clip',
                        }}
                    >
                        {card.description}
                    </Typography>
                </Box>

                {/* Lower section: action buttons */}
                {/*
          Mirrors Blazor's MudGrid max-height:50px with two 60px MudItems.
          ButtonGroup keeps them side-by-side at equal width.
        */}
                <ButtonGroup
                    variant="text"
                    size="small"
                    fullWidth
                    sx={{ maxHeight: 50, borderTop: '1px solid rgba(0,0,0,0.1)' }}
                >
                    <Button
                        sx={{ fontSize: '0.6rem', flex: 1 }}
                        onClick={() => setUpdateOpen(true)}
                    >
                        Actions
                    </Button>
                    <Button
                        sx={{ fontSize: '0.6rem', flex: 1 }}
                        onClick={() => onDeleted?.(card.id)}
                        color="error"
                    >
                        Remove
                    </Button>
                </ButtonGroup>
            </Paper>

            {/* ── Update overlay ─────────────────────────────────────────────────── */}
            <UpdateCardOverlay
                open={updateOpen}
                onClose={() => setUpdateOpen(false)}
                card={card}
                boardId={boardId}
                onUpdated={updated => {
                    onUpdated?.({ ...dropCard, card: updated })
                    setUpdateOpen(false)
                }}
                onDeleted={cardId => {
                    onDeleted?.(cardId)
                    setUpdateOpen(false)
                }}
            />
        </>
    )
}

export default BoardCard