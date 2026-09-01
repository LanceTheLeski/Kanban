/**
 * DeleteSwimlaneOverlay
 *
 * Mirrors: DeleteSwimlaneOverlay.razor + DeleteSwimlaneOverlay.cs
 *
 * Structurally identical to DeleteColumnOverlay — see that file for the pattern
 * notes on selection-by-title and why the board is re-read after a delete.
 */

import React, { useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { deleteSwimlane } from '../../../APIs/Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface DeleteSwimlaneOverlayProps {
    open: boolean
    onClose: () => void
}

export const DeleteSwimlaneOverlay: React.FC<DeleteSwimlaneOverlayProps> = ({ open, onClose }) => {
    const { boardId, swimlanes } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        swimlanes: state.swimlanes,
    })))
    const { run } = useBoardActions()

    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)

    const handleSelect = (title: string) => {
        // Preserve Blazor's uniqueness guard
        const matches = swimlanes.filter(swimlane => swimlane.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 swimlane with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedTitle(title)
    }

    const handleSubmit = async () => {
        if (!boardId || !selectedTitle) return

        const swimlane = swimlanes.find(candidate => candidate.title === selectedTitle)
        if (!swimlane) return

        // Deleting a swimlane shifts the remaining orders and moves the cards that
        // were in it — the refresh inside run() picks all of that up.
        const deleted = await run('Deleting swimlane', () => deleteSwimlane(boardId, swimlane.id))
        if (!deleted) return

        setSelectedTitle(null)
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Delete Swimlane</Typography>

                <ArcExpandingSelector
                    options={swimlanes.map(swimlane => swimlane.title)}
                    onSelect={handleSelect}
                    placeholder="Select swimlane to delete"
                />
            </Stack>
        </ArcOverlay>
    )
}

export default DeleteSwimlaneOverlay
