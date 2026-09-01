/**
 * DeleteColumnOverlay
 *
 * Mirrors: DeleteColumnOverlay.razor + DeleteColumnOverlay.cs
 *
 * Blazor used index-aligned List<Guid> + List<string> to find the column by title,
 * then called RemoveAt() on both lists in lockstep. This was fragile — a mismatch
 * between the two lists would silently delete the wrong column.
 *
 * Here we work with Column objects directly. Selection gives us the column ID,
 * and we pass that to the API. No index alignment needed.
 *
 * The uniqueness validation (matchingColumnNameCount !== 1) is preserved:
 * duplicate column titles on the same board are treated as an error.
 */

import React, { useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { deleteColumn } from '../../../APIs/Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface DeleteColumnOverlayProps {
    open: boolean
    onClose: () => void
}

export const DeleteColumnOverlay: React.FC<DeleteColumnOverlayProps> = ({ open, onClose }) => {
    const { boardId, columns } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        columns: state.columns,
    })))
    const { run } = useBoardActions()

    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)

    const handleSelect = (title: string) => {
        // Preserve Blazor's uniqueness guard
        const matches = columns.filter(column => column.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 column with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedTitle(title)
    }

    const handleSubmit = async () => {
        if (!boardId || !selectedTitle) return

        const column = columns.find(candidate => candidate.title === selectedTitle)
        if (!column) return

        // Deleting a column shifts the remaining orders and moves the cards that
        // were in it — the refresh inside run() picks all of that up.
        const deleted = await run('Deleting column', () => deleteColumn(boardId, column.id))
        if (!deleted) return

        setSelectedTitle(null)
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Delete Column</Typography>

                <ArcExpandingSelector
                    options={columns.map(column => column.title)}
                    onSelect={handleSelect}
                    placeholder="Select column to delete"
                />
            </Stack>
        </ArcOverlay>
    )
}

export default DeleteColumnOverlay
