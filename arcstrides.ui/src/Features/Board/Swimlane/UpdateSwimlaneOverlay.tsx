/**
 * UpdateSwimlaneOverlay
 *
 * Mirrors: UpdateSwimlaneOverlay.razor + UpdateSwimlaneOverlay.cs
 *
 * Structurally identical to UpdateColumnOverlay — same RemoveAt() bug in the
 * Blazor original, same fix here. See that file for the pattern notes.
 */

import React, { useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { updateSwimlane } from '../../../APIs/Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface UpdateSwimlaneOverlayProps {
    open: boolean
    onClose: () => void
}

export const UpdateSwimlaneOverlay: React.FC<UpdateSwimlaneOverlayProps> = ({ open, onClose }) => {
    const { boardId, swimlanes } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        swimlanes: state.swimlanes,
    })))
    const { run } = useBoardActions()

    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
    const [replacementTitle, setReplacementTitle] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null)

    // Derived from store — mirrors Blazor's GetSwimlaneIndexList() / OnParametersSet()
    // but reactive: always reflects current swimlane count
    const orderOptions = swimlanes.map((_, index) => String(index))

    const handleSelectSwimlane = (title: string) => {
        const matches = swimlanes.filter(swimlane => swimlane.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 swimlane with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedTitle(title)
        setReplacementTitle(title) // Pre-fill with current title, mirrors Blazor
    }

    const handleSubmit = async () => {
        if (!boardId || !selectedTitle) return

        const swimlane = swimlanes.find(candidate => candidate.title === selectedTitle)
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

        const updated = await run('Updating swimlane', () => updateSwimlane(boardId, swimlane.id, patch))
        if (!updated) return

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
                    options={swimlanes.map(swimlane => swimlane.title)}
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
                    onSelect={value => setSelectedOrder(parseInt(value, 10))}
                    placeholder="Select new order position"
                />
            </Stack>
        </ArcOverlay>
    )
}

export default UpdateSwimlaneOverlay
