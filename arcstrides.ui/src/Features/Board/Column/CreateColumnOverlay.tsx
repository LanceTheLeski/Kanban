/**
 * CreateColumnOverlay
 *
 * Mirrors: CreateColumnOverlay.razor + CreateColumnOverlay.cs
 *
 * Blazor pattern:
 *   - Partial class implemented IArcOverlay (OpenOverlay / CloseOverlay)
 *   - Parent held a @ref and called createColumnOverlay.OpenOverlay() imperatively
 *   - Data (Columns, ColumnTitles) passed in as @bind- parameters, mutated in place,
 *     then InvokeAsync'd back up + Refresh fired
 *
 * React pattern:
 *   - open/onClose controlled by parent useState (no @ref, no imperative calls)
 *   - Mutations go to the Zustand store via addColumn() — no prop drilling needed
 *   - boardId read from store instead of passed as prop
 *
 * The Blazor version fell back to Columns.Count() as default order if _columnOrder
 * was null. We preserve that: empty order field → append at end.
 */

import React, { useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { createColumn } from '../../../APIs/Board.APIs'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface CreateColumnOverlayProps {
    open: boolean
    onClose: () => void
}

export const CreateColumnOverlay: React.FC<CreateColumnOverlayProps> = ({ open, onClose }) => {
    const { boardId, columns, addColumn } = useBoardStore(useShallow(s => ({
        boardId: s.boardId,
        columns: s.columns,
        addColumn: s.addColumn,
    })))

    const [title, setTitle] = useState('')
    const [orderInput, setOrderInput] = useState('')

    const handleSubmit = async () => {
        if (!boardId || !title.trim()) return

        // Mirror Blazor fallback: if no order given, append at end
        const order = orderInput.trim() !== '' ? parseInt(orderInput, 10) : columns.length

        const newColumn = await createColumn(boardId, { title: title.trim(), order })

        // Update store directly with server response — no extra GET needed
        addColumn(newColumn)

        setTitle('')
        setOrderInput('')
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Add a New Column</Typography>

                <TextField
                    label="Title"
                    variant="filled"
                    helperText="Column Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    fullWidth
                />

                <TextField
                    label="Order"
                    variant="filled"
                    helperText={`Column Order (leave blank to append at position ${columns.length})`}
                    value={orderInput}
                    onChange={e => setOrderInput(e.target.value)}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    fullWidth
                />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateColumnOverlay