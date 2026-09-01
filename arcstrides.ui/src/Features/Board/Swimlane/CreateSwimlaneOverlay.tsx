/**
 * CreateSwimlaneOverlay
 *
 * Mirrors: CreateSwimlaneOverlay.razor + CreateSwimlaneOverlay.cs
 *
 * Structurally identical to CreateColumnOverlay — see that file for the pattern
 * notes on useBoardActions and why the board is re-read after a create.
 */

import React, { useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { createSwimlane } from '../../../APIs/Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface CreateSwimlaneOverlayProps {
    open: boolean
    onClose: () => void
}

export const CreateSwimlaneOverlay: React.FC<CreateSwimlaneOverlayProps> = ({ open, onClose }) => {
    const { boardId, swimlanes } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        swimlanes: state.swimlanes,
    })))
    const { run } = useBoardActions()

    const [title, setTitle] = useState('')
    const [orderInput, setOrderInput] = useState('')

    const handleSubmit = async () => {
        if (!boardId || !title.trim()) return

        // Mirror Blazor fallback: if no order given, append at end
        const order = orderInput.trim() !== '' ? parseInt(orderInput, 10) : swimlanes.length

        const created = await run('Adding swimlane', () =>
            createSwimlane(boardId, { title: title.trim(), order })
        )
        if (!created) return

        setTitle('')
        setOrderInput('')
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Add a New Swimlane</Typography>

                <TextField
                    label="Title"
                    variant="filled"
                    helperText="Swimlane Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    fullWidth
                />

                <TextField
                    label="Order"
                    variant="filled"
                    helperText={`Swimlane Order (leave blank to append at position ${swimlanes.length})`}
                    value={orderInput}
                    onChange={e => setOrderInput(e.target.value)}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    fullWidth
                />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateSwimlaneOverlay
