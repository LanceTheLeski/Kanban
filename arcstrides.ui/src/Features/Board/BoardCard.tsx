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
import { UpdateCardOverlay } from './Card/UpdateCardOverlay'
import { useBoardActions } from './useBoardActions'
import { deleteCard } from './Board.APIs'
import { useBoardStore } from './Board.Store'
import { CARD_MIN_HEIGHT, DRAG_PREVIEW_WIDTH } from './Board.Layout'
import { CARD_ACTIONS_MAX_HEIGHT } from '../../Styles/Measures'
import type { Card } from '../../Entities/Card/Card.Types'

interface BoardCardProps {
    card: Card
    boardId: string
    /**
     * dnd-kit listeners/attributes. Applied to the whole tile — the sensors
     * decide what is a drag and what is a click, not a dedicated handle.
     */
    dragProps?: Record<string, unknown>
    /** Renders the static copy shown inside dnd-kit's DragOverlay. */
    preview?: boolean
}

export const BoardCard: React.FC<BoardCardProps> = ({
    card,
    boardId,
    dragProps,
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
            <Paper {...(dragProps ?? {})}
                   /*
                      A square of paper with adhesive along one edge — see .note.
                      One colour for every card: the lane is already said by
                      where the note is.
                   */
                   className="note"
                   sx={{ // Fills the cell rather than sitting at a fixed 120px inside a
                         // 300px column. A card is mostly text, and the old width cut
                         // titles off after about four words with most of the column
                         // left empty. Height is a floor so a long title can push it.
                         width: '100%',
                         minHeight: CARD_MIN_HEIGHT,
                         // The ghost has no cell to fill, so give it the column's width.
                         ...(preview ? { width: DRAG_PREVIEW_WIDTH } : {}),
                         display: 'flex',
                         flexDirection: 'column',
                         textAlign: 'center',
                         // The drag ghost sits above everything and shouldn't intercept pointers
                         ...(preview ? { boxShadow: 6, cursor: 'grabbing', pointerEvents: 'none' } : {}),
                         // The whole tile is the grab surface now, so it says so.
                         cursor: dragProps ? 'grab' : 'default',
                         '&:active': { cursor: dragProps ? 'grabbing' : 'default' } }}
                   elevation={3}>
                {/* Card content. A press here opens the card; a press that travels
                    8px drags it instead. */}
                <Box onClick={() => !preview && setUpdateOpen(true)}
                     sx={{ flex: 1,
                           minHeight: 0,
                           cursor: preview ? 'grabbing' : 'pointer',
                           p: 0.5,
                           overflow: 'hidden',
                           // MUI's own hover shade, which this was a hand-written copy of.
                           '&:hover': preview ? undefined : { backgroundColor: 'action.hover' } }}>
                    {/* Title — mirrors MudText font-weight:600 font-size:x-small */}
                    {/*
              Two lines, then ellipsis. Titles are user-written and the old single
              nowrap line clipped most of them; -webkit-line-clamp is the only way
              to ellipsise across more than one line, and is supported everywhere
              this app runs.
            */}
                    <Typography sx={{ fontWeight: 600,
                                      fontSize: '0.7rem',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      overflowWrap: 'anywhere' }}>
                        {card.title}
                    </Typography>

                    {/*
                        Description — mirrors MudText height:100px font-size:x-small.

                        `pre-line` so a description written as a list still reads
                        as one. Without it every newline collapsed to a space and
                        four bullet points arrived as one run-on sentence, which
                        is the opposite of what the author typed them as.

                        The blank lines between paragraphs go, though — see
                        previewText. Three clamped lines is not enough room to
                        spend one of them on nothing.
                    */}
                    <Typography sx={{ fontSize: '0.65rem',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      overflowWrap: 'anywhere',
                                      whiteSpace: 'pre-line',
                                      textAlign: 'left',
                                      opacity: 0.85 }}>
                        {previewText(card.description)}
                    </Typography>
                </Box>

                {/* Lower section: action buttons */}
                {/* Mirrors Blazor's MudGrid max-height:50px with two 60px MudItems. */}
                <ButtonGroup variant="text"
                             size="small"
                             fullWidth
                             sx={{ maxHeight: CARD_ACTIONS_MAX_HEIGHT,
                                   flexShrink: 0,
                                   // px: a hairline is chrome, and should not thicken with
                                   // the reader's font size. The colour is the note's,
                                   // set by .note from its stock.
                                   borderTop: '1px solid' }}>
                    {/*
                        Ink on the note, not MUI's blue and red. A chromatic
                        button on a coloured note is two colours arguing over a
                        20px strip, and the one that loses is the note — which is
                        the thing the board is made of.
                    */}
                    <Button sx={{ fontSize: '0.6rem',
                                  flex: 1,
                                  minWidth: 0,
                                  color: 'arc.onPaper',
                                  '&:hover': { backgroundColor: 'arc.paperHover' } }}
                            onClick={() => setUpdateOpen(true)}
                            disabled={preview}>
                        Actions
                    </Button>
                    <Button sx={{ fontSize: '0.6rem',
                                  flex: 1,
                                  minWidth: 0,
                                  color: 'arc.paperDanger',
                                  '&:hover': { backgroundColor: 'arc.paperHover' } }}
                            onClick={() => setConfirmDeleteOpen(true)}
                            disabled={preview}>
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
                <UpdateCardOverlay open
                                   onClose={() => setUpdateOpen(false)}
                                   card={card}
                                   boardId={boardId} />
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

// ── Private ───────────────────────────────────────────────────────────────────

/**
 * A description as the tile shows it: line breaks kept, blank lines dropped.
 *
 * A card tile has three clamped lines. A description written as a bulleted list
 * with a blank line between items would spend two of them on nothing and show
 * two bullets; collapsing the runs shows three. Trailing spaces go too, because
 * `pre-line` renders them and a stray one shifts the clamp's ellipsis.
 */
function previewText(description: string): string {
    return description
        .split('\n')
        .map(line => line.trimEnd())
        .filter(line => line.length > 0)
        .join('\n')
}

export default BoardCard
