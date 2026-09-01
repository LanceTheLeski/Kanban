/**
 * UpdateColumnOverlay
 *
 * Mirrors: UpdateColumnOverlay.razor + UpdateColumnOverlay.cs
 *
 * Notable fix from the Blazor version:
 *   The Blazor cs partial class called Columns.RemoveAt() and ColumnTitles.RemoveAt()
 *   after an update but never re-inserted, leaving the UI with one fewer column.
 *   The comment literally said "This is not actually what we want."
 *
 * The Blazor version used OnParametersSet() to regenerate the order list whenever
 * columns changed. Here we derive it from the store directly in render — no lifecycle
 * hook needed because store subscriptions are reactive.
 *
 * Reordering rewrites sibling column orders and card positions server-side, so the
 * board is re-read afterwards rather than recomputed locally. See useBoardActions.
 */

import React, { useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { updateColumn } from '../../../APIs/Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface UpdateColumnOverlayProps {
    open: boolean
    onClose: () => void
}

export const UpdateColumnOverlay: React.FC<UpdateColumnOverlayProps> = ({ open, onClose }) => {
    const { boardId, columns } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        columns: state.columns,
    })))
    const { run } = useBoardActions()

    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
    const [replacementTitle, setReplacementTitle] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null)

    // Derived from store — mirrors Blazor's GetColumnIndexList() / OnParametersSet()
    // but reactive: always reflects current column count
    const orderOptions = columns.map((_, index) => String(index))

    const handleSelectColumn = (title: string) => {
        const matches = columns.filter(column => column.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 column with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedTitle(title)
        setReplacementTitle(title) // Pre-fill with current title, mirrors Blazor
    }

    const handleSubmit = async () => {
        if (!boardId || !selectedTitle) return

        const column = columns.find(candidate => candidate.title === selectedTitle)
        if (!column) return

        const patch: { title?: string; order?: number } = {}

        if (replacementTitle.trim() && replacementTitle !== selectedTitle)
            patch.title = replacementTitle.trim()

        if (selectedOrder !== null && selectedOrder !== column.order)
            patch.order = selectedOrder

        if (Object.keys(patch).length === 0) {
            onClose()
            return
        }

        const updated = await run('Updating column', () => updateColumn(boardId, column.id, patch))
        if (!updated) return

        setSelectedTitle(null)
        setReplacementTitle('')
        setSelectedOrder(null)
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Edit Column</Typography>

                <ArcExpandingSelector
                    options={columns.map(column => column.title)}
                    onSelect={handleSelectColumn}
                    placeholder="Select column to edit"
                />

                <TextField
                    label="New Title"
                    variant="filled"
                    helperText="Column Title"
                    value={replacementTitle}
                    onChange={e => setReplacementTitle(e.target.value)}
                    fullWidth
                />

                <ArcExpandingSelector
                    options={orderOptions}
                    onSelect={value => setSelectedOrder(parseInt(value, 10))}
                    placeholder="Select new order position"
                />
            </Stack>
        </ArcOverlay>
    )
}

export default UpdateColumnOverlay
