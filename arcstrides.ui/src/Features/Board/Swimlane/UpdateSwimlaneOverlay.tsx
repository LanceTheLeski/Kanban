/**
 * UpdateSwimlaneOverlay
 *
 * Mirrors: UpdateSwimlaneOverlay.razor + UpdateSwimlaneOverlay.cs
 *
 * Structurally identical to UpdateColumnOverlay — same bug fix applies.
 * The Blazor version also called RemoveAt() without re-inserting. Fixed here.
 *
 * See UpdateColumnOverlay.tsx for full pattern notes.
 */

import React, { useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { updateSwimlane } from '../../../APIs/Board.APIs'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface UpdateSwimlaneOverlayProps {
    open: boolean
    onClose: () => void
}

export const UpdateSwimlaneOverlay: React.FC<UpdateSwimlaneOverlayProps> = ({ open, onClose }) => {
    const { boardId, swimlanes, updateSwimlaneInStore } = useBoardStore(useShallow(s => ({
        boardId: s.boardId,
        swimlanes: s.swimlanes,
        updateSwimlaneInStore: s.updateSwimlane,
    })))

    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
    const [replacementTitle, setReplacementTitle] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null)

    const orderOptions = swimlanes.map((_, i) => String(i))

    const handleSelectSwimlane = (title: string) => {
        const matches = swimlanes.filter(s => s.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 swimlane with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedTitle(title)
        setReplacementTitle(title)
    }

    const handleSubmit = async () => {
        if (!boardId || !selectedTitle) return

        const swimlane = swimlanes.find(s => s.title === selectedTitle)
        if (!swimlane) return

        const patch: { title?: string; order?: number } = {}

        if (replacementTitle.trim() && replacementTitle !== selectedTitle)
            patch.title = replacementTitle.trim()

        if (selectedOrder !== null && selectedOrder !== swimlane.order)
            patch.order = selectedOrder

        if (Object.keys(patch).length === 0) {
            onClose()
            return
        }

        await updateSwimlane(boardId, swimlane.id, patch)

        updateSwimlaneInStore(swimlane.id, {
            title: patch.title,
            newOrder: patch.order,
        })

        setSelectedTitle(null)
        setReplacementTitle('')
        setSelectedOrder(null)
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Edit Swimlane</Typography>

                <ArcExpandingSelector
                    options={swimlanes.map(s => s.title)}
                    onSelect={handleSelectSwimlane}
                    placeholder="Select swimlane to edit"
                />

                <TextField
                    label="New Title"
                    variant="filled"
                    helperText="Swimlane Title"
                    value={replacementTitle}
                    onChange={e => setReplacementTitle(e.target.value)}
                    fullWidth
                />

                <ArcExpandingSelector
                    options={orderOptions}
                    onSelect={v => setSelectedOrder(parseInt(v, 10))}
                    placeholder="Select new order position"
                />
            </Stack>
        </ArcOverlay>
    )
}

export default UpdateSwimlaneOverlay