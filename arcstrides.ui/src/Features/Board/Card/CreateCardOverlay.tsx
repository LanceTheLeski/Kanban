/**
 * CreateCardOverlay
 *
 * Mirrors: CreateCardOverlay.razor + CreateCardOverlay.cs
 *
 * ── Column/Swimlane selection ────────────────────────────────────────────────
 * Blazor used parallel List<Guid> + List<string> and looked the ID up by the
 * index of the selected title. Here the store holds Column/Swimlane objects, so
 * the selected title resolves straight to an object.
 *
 * The uniqueness guard from the Blazor original is kept: two columns with the
 * same title is an error rather than a coin flip over which one is meant.
 *
 * ── Why the board is re-read afterwards ──────────────────────────────────────
 * CardController.CreateCard responds with a CardPositionResponse whose `id` is
 * the new *position* row, not the new card — the card's own ID never makes it
 * into the response. There is nothing to splice into local state, so the create
 * is followed by a refresh (handled inside useBoardActions).
 */

import React, { useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { createCard } from '../../../APIs/Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { useBoardStore } from '../../../Stores/BoardStores'

interface CreateCardOverlayProps {
    open: boolean
    onClose: () => void
}

export const CreateCardOverlay: React.FC<CreateCardOverlayProps> = ({ open, onClose }) => {
    const { boardId, columns, swimlanes } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        columns: state.columns,
        swimlanes: state.swimlanes,
    })))
    const { run } = useBoardActions()

    const [cardTitle, setCardTitle] = useState('')
    const [cardDescription, setCardDescription] = useState('')
    const [selectedColumnTitle, setSelectedColumnTitle] = useState<string | null>(null)
    const [selectedSwimlaneTitle, setSelectedSwimlaneTitle] = useState<string | null>(null)

    const handleSelectColumn = (title: string) => {
        const matches = columns.filter(column => column.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 column with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedColumnTitle(title)
    }

    const handleSelectSwimlane = (title: string) => {
        const matches = swimlanes.filter(swimlane => swimlane.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 swimlane with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedSwimlaneTitle(title)
    }

    const handleSubmit = async () => {
        if (!boardId || !cardTitle.trim() || !selectedColumnTitle || !selectedSwimlaneTitle) return

        const column = columns.find(candidate => candidate.title === selectedColumnTitle)
        const swimlane = swimlanes.find(candidate => candidate.title === selectedSwimlaneTitle)
        if (!column || !swimlane) return

        const created = await run('Adding card', () =>
            createCard(boardId, {
                title: cardTitle.trim(),
                description: cardDescription.trim(),
                columnId: column.id,
                swimlaneId: swimlane.id,
            })
        )
        if (!created) return

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
                    helperText="Card Description"
                    value={cardDescription}
                    onChange={e => setCardDescription(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                />

                {/* Column selector — mirrors @bind-Options="ColumnTitles" */}
                <ArcExpandingSelector
                    options={columns.map(column => column.title)}
                    onSelect={handleSelectColumn}
                    placeholder="Select Column"
                />

                {/* Swimlane selector — mirrors @bind-Options="SwimlaneTitles" */}
                <ArcExpandingSelector
                    options={swimlanes.map(swimlane => swimlane.title)}
                    onSelect={handleSelectSwimlane}
                    placeholder="Select Swimlane"
                />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateCardOverlay
