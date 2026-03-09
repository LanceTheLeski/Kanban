/**
 * DeleteSwimlaneOverlay
 *
 * Mirrors: DeleteSwimlaneOverlay.razor + DeleteSwimlaneOverlay.cs
 * Structurally identical to DeleteColumnOverlay. See that file for pattern notes.
 */

import React, { useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { deleteSwimlane } from '../../../APIs/Board.APIs'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface DeleteSwimlaneOverlayProps {
    open: boolean
    onClose: () => void
}

export const DeleteSwimlaneOverlay: React.FC<DeleteSwimlaneOverlayProps> = ({ open, onClose }) => {
    const { boardId, swimlanes, deleteSwimlaneFromStore } = useBoardStore(useShallow(s => ({
        boardId: s.boardId,
        swimlanes: s.swimlanes,
        deleteSwimlaneFromStore: s.deleteSwimlane,
    })))

    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)

    const handleSelect = (title: string) => {
        const matches = swimlanes.filter(s => s.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 swimlane with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedTitle(title)
    }

    const handleSubmit = async () => {
        if (!boardId || !selectedTitle) return

        const swimlane = swimlanes.find(s => s.title === selectedTitle)
        if (!swimlane) return

        await deleteSwimlane(boardId, swimlane.id)

        deleteSwimlaneFromStore(swimlane.id)

        setSelectedTitle(null)
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Delete Swimlane</Typography>

                <ArcExpandingSelector
                    options={swimlanes.map(s => s.title)}
                    onSelect={handleSelect}
                    placeholder="Select swimlane to delete"
                />
            </Stack>
        </ArcOverlay>
    )
}

export default DeleteSwimlaneOverlay