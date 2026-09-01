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
 * inline. Card mutations go through the store, so no update/delete callbacks
 * have to be threaded back up through BoardPage.
 *
 * ── Deleting ─────────────────────────────────────────────────────────────────
 * Blazor had a separate DeleteCardOverlay for confirmation. The Remove button
 * here opens a confirmation prompt and then calls the API — an earlier version
 * of this file removed the card from local state without telling the server,
 * so the card reappeared on the next load.
 */

import React, { useState } from 'react'
import {
    Box,
    Button,
    ButtonGroup,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Paper,
    Typography,
} from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { UpdateCardOverlay } from './Card/UpdateCardOverlay'
import { useBoardActions } from './useBoardActions'
import { deleteCard } from '../../APIs/Board.APIs'
import { useBoardStore } from '../../Stores/BoardStores'
import type { Card } from '../../Types/Board.Types'

interface BoardCardProps {
    card: Card
    boardId: string
    /** dnd-kit listeners/attributes, applied to the drag handle strip only. */
    dragHandleProps?: Record<string, unknown>
    /** Renders the static copy shown inside dnd-kit's DragOverlay. */
    preview?: boolean
}

export const BoardCard: React.FC<BoardCardProps> = ({
    card,
    boardId,
    dragHandleProps,
    preview = false,
}) => {
    const [updateOpen, setUpdateOpen] = useState(false)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
    const { run } = useBoardActions()
    const removeCard = useBoardStore(state => state.removeCard)

    const handleDelete = async () => {
        const deleted = await run(
            `Deleting "${card.title}"`,
            () => deleteCard(boardId, card.id),
            // Local removal below is already correct — no need to re-read the board
            { refresh: false }
        )

        if (deleted) removeCard(card.id)
        setConfirmDeleteOpen(false)
    }

    return (
        <>
            {/* ── Card tile ─────────────────────────────────────────────────────── */}
            {/* Mirrors: MudPaper width=120px height=200px background-color=lightyellow */}
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
                    // The drag ghost sits above everything and shouldn't intercept pointers
                    ...(preview ? { boxShadow: 6, cursor: 'grabbing', pointerEvents: 'none' } : {}),
                }}
                elevation={3}
            >
                {/* Drag handle — carries the dnd-kit listeners so the buttons below stay clickable */}
                <Box
                    {...(dragHandleProps ?? {})}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 16,
                        flexShrink: 0,
                        color: 'rgba(0,0,0,0.35)',
                        cursor: dragHandleProps ? 'grab' : 'default',
                        touchAction: 'none', // required by dnd-kit for touch devices
                        '&:active': { cursor: dragHandleProps ? 'grabbing' : 'default' },
                    }}
                >
                    <DragIndicatorIcon sx={{ fontSize: 14, transform: 'rotate(90deg)' }} />
                </Box>

                {/* Upper section: clickable card content */}
                <Box
                    onClick={() => !preview && setUpdateOpen(true)}
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        cursor: preview ? 'grabbing' : 'pointer',
                        p: 0.5,
                        overflow: 'hidden',
                        '&:hover': preview ? undefined : { backgroundColor: 'rgba(0,0,0,0.04)' },
                    }}
                >
                    {/* Title — mirrors MudText font-weight:600 font-size:x-small */}
                    <Typography
                        sx={{
                            height: 20,
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {card.title}
                    </Typography>

                    {/* Description — mirrors MudText height:100px font-size:x-small */}
                    <Typography
                        sx={{
                            fontSize: '0.65rem',
                            overflow: 'hidden',
                            textAlign: 'left',
                        }}
                    >
                        {card.description}
                    </Typography>
                </Box>

                {/* Lower section: action buttons */}
                {/* Mirrors Blazor's MudGrid max-height:50px with two 60px MudItems. */}
                <ButtonGroup
                    variant="text"
                    size="small"
                    fullWidth
                    sx={{ maxHeight: 50, flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.1)' }}
                >
                    <Button
                        sx={{ fontSize: '0.6rem', flex: 1, minWidth: 0 }}
                        onClick={() => setUpdateOpen(true)}
                        disabled={preview}
                    >
                        Actions
                    </Button>
                    <Button
                        sx={{ fontSize: '0.6rem', flex: 1, minWidth: 0 }}
                        onClick={() => setConfirmDeleteOpen(true)}
                        color="error"
                        disabled={preview}
                    >
                        Remove
                    </Button>
                </ButtonGroup>
            </Paper>

            {/*
        ── Update overlay ───────────────────────────────────────────────────
        Mounted only while open. It carries the timeline pickers, the task
        popovers and a task-types fetch, so keeping one alive per card would
        cost a request and a picker tree for every card on the board. Mounting
        on open also means its draft state starts fresh each time.
      */}
            {!preview && updateOpen && (
                <UpdateCardOverlay
                    open
                    onClose={() => setUpdateOpen(false)}
                    card={card}
                    boardId={boardId}
                />
            )}

            {/* ── Delete confirmation — mirrors DeleteCardOverlay.razor ──────────── */}
            {!preview && (
                <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
                    <DialogTitle>Remove this card?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            "{card.title}" and its tasks will be removed from the board.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
                        <Button onClick={handleDelete} color="error">Remove</Button>
                    </DialogActions>
                </Dialog>
            )}
        </>
    )
}

export default BoardCard
