/**
 * CreateCardOverlay
 *
 * Mirrors: CreateCardOverlay.razor + CreateCardOverlay.cs
 *
 * Key translation notes:
 *
 * 1. Column/Swimlane selection — Blazor used parallel List<Guid> + List<string>
 *    indexed together. Here we read Column/Swimlane objects from the store and
 *    find by title. The uniqueness validation from the .cs partial is preserved.
 *
 * 2. dropArea — the Blazor helper ConvertColumnAndSwimlaneToCardArea() built a
 *    "{swimlaneOrder}_{columnOrder}" string. We replicate this from the response.
 *
 * 3. The Blazor .cs had a partially-commented-out CardMapper and a TODO about
 *    using boardResponse as source of truth. We take the cleaner path: use the
 *    server's response object directly, as the non-commented code was already doing.
 */

import React, { useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { createCard } from '../../../APIs/Board.APIs'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface CreateCardOverlayProps {
    open: boolean
    onClose: () => void
}

export const CreateCardOverlay: React.FC<CreateCardOverlayProps> = ({ open, onClose }) => {
    const { boardId, columns, swimlanes, addCard } = useBoardStore(useShallow(s => ({
        boardId: s.boardId,
        columns: s.columns,
        swimlanes: s.swimlanes,
        addCard: s.addCard,
    })))

    const [cardTitle, setCardTitle] = useState('')
    const [cardDescription, setCardDescription] = useState('')
    const [selectedColumnTitle, setSelectedColumnTitle] = useState<string | null>(null)
    const [selectedSwimlaneTitle, setSelectedSwimlaneTitle] = useState<string | null>(null)

    const handleSelectColumn = (title: string) => {
        const matches = columns.filter(c => c.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 column with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedColumnTitle(title)
    }

    const handleSelectSwimlane = (title: string) => {
        const matches = swimlanes.filter(s => s.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 swimlane with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedSwimlaneTitle(title)
    }

    const handleSubmit = async () => {
        if (!boardId || !cardTitle.trim() || !selectedColumnTitle || !selectedSwimlaneTitle) return

        const column = columns.find(c => c.title === selectedColumnTitle)!
        const swimlane = swimlanes.find(s => s.title === selectedSwimlaneTitle)!

        const newDropCard = await createCard(boardId, {
            title: cardTitle.trim(),
            description: cardDescription.trim(),
            columnId: column.id,
            swimlaneId: swimlane.id,
        })

        // Compute dropArea from the column/swimlane orders we already know locally.
        // The server response from the stub doesn't know these orders, but the real
        // server returns columnOrder and swimlaneOrder — use those when wiring up.
        const dropAreaFromStore = `${swimlane.order}_${column.order}`
        addCard({ ...newDropCard, dropArea: dropAreaFromStore })

        setCardTitle('')
        setCardDescription('')
        setSelectedColumnTitle(null)
        setSelectedSwimlaneTitle(null)
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Add a New Card</Typography>

                <TextField
                    label="Title"
                    variant="filled"
                    helperText="Card Title"
                    value={cardTitle}
                    onChange={e => setCardTitle(e.target.value)}
                    fullWidth
                />

                <TextField
                    label="Description"
                    variant="filled"
                    helperText="Description"
                    value={cardDescription}
                    onChange={e => setCardDescription(e.target.value)}
                    multiline
                    rows={7}
                    fullWidth
                />

                {/* Column selector — mirrors @bind-Options="ColumnTitles" */}
                <ArcExpandingSelector
                    options={columns.map(c => c.title)}
                    onSelect={handleSelectColumn}
                    placeholder="Select Column"
                />

                {/* Swimlane selector — mirrors @bind-Options="SwimlaneTitles" */}
                <ArcExpandingSelector
                    options={swimlanes.map(s => s.title)}
                    onSelect={handleSelectSwimlane}
                    placeholder="Select Swimlane"
                />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateCardOverlay