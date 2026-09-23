/**
 * CreateColumnOverlay
 *
 * Mirrors: CreateColumnOverlay.razor + CreateColumnOverlay.cs
 *
 * ── Pattern used by all six column/swimlane overlays ─────────────────────────
 * Every mutation goes through useBoardActions().run(), which surfaces failures in
 * the snackbar and re-reads the board on success. The overlay only closes when the
 * call actually succeeded, so a failed request leaves the user's input in place
 * instead of discarding it.
 *
 * The board is re-read rather than patched locally because inserting a column at a
 * given order shifts the order of every column after it *and* rewrites the affected
 * card positions server-side — see the note at the top of Board.Store.ts.
 */

import React, { useState } from 'react'
import { Stack, TextField } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { createColumn } from '../Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { columnColour, landingIndex } from '../Board.Colours'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'

interface CreateColumnOverlayProps {
    open: boolean
    onClose: () => void
}

export const CreateColumnOverlay: React.FC<CreateColumnOverlayProps> = ({ open, onClose }) => {
    const { boardId, columns } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        columns: state.columns,
    })))
    const { run } = useBoardActions()

    const [title, setTitle] = useState('')
    const [orderInput, setOrderInput] = useState('')
    // Null is the normal case: the column takes its place on the ramp.
    const [colour, setColour] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!boardId || !title.trim()) return

        // Mirror Blazor fallback: if no order given, append at end
        const order = orderInput.trim() !== '' ? parseInt(orderInput, 10) : columns.length

        const created = await run('Adding column', () =>
            createColumn(boardId, { title: title.trim(), order, colour, globalColour: colour })
        )
        if (!created) return

        setTitle('')
        setOrderInput('')
        setColour(null)
        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    title="Add a column"
                    titleStock="blue">
            <Stack spacing={1.5}>
                <TextField {...paperField()}
                           placeholder="Column title"
                           value={title}
                           onChange={e => setTitle(e.target.value)}
                           fullWidth />

                <TextField {...paperField()}
                           placeholder="Order"
                           helperText={`Leave blank to append at position ${columns.length}`}
                           value={orderInput}
                           onChange={e => setOrderInput(e.target.value)}
                           inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                           fullWidth />

                {/*
                    Both colours take the same value for now. They are separate
                    fields because the per-board one may repeat and the global one
                    may not — the API does not enforce that yet, which is noted in
                    docs/api-gaps.md.
                */}
                <ArcColourPicker value={colour}
                                 onChange={setColour}
                                 fallback={columnColour(null, landingIndex(orderInput, columns.length), columns.length + 1)}
                                 label="Column colour" />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateColumnOverlay
