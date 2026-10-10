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
 * ── A board with no swimlanes ────────────────────────────────────────────────
 * A board may have none, and its cards then sit straight in their columns. The
 * swimlane selector is not shown there, the card is sent with no swimlane, and
 * the server puts it in none. A board with no columns has nowhere for a card at
 * all, and says so instead of offering a form that cannot be saved.
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
import { createCard } from '../Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'

interface CreateCardOverlayProps
{
    open: boolean
    onClose: () => void
}

export const CreateCardOverlay: React.FC<CreateCardOverlayProps> = ({ open, onClose }) =>
{
    const { boardId, columns, swimlanes } = useBoardStore(useShallow(state =>
    ({
        boardId: state.boardId,
        columns: state.columns,
        swimlanes: state.swimlanes,
    })))
    const { run } = useBoardActions()

    const [cardTitle, setCardTitle] = useState('')
    const [cardDescription, setCardDescription] = useState('')
    const [selectedColumnTitle, setSelectedColumnTitle] = useState<string | null>(null)
    const [selectedSwimlaneTitle, setSelectedSwimlaneTitle] = useState<string | null>(null)

    const handleSelectColumn = (title: string) =>
    {
        const matches = columns.filter(column => column.title === title)
        if (matches.length !== 1)
        {
            console.error(`Expected exactly 1 column with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedColumnTitle(title)
    }

    const handleSelectSwimlane = (title: string) =>
    {
        const matches = swimlanes.filter(swimlane => swimlane.title === title)
        if (matches.length !== 1)
        {
            console.error(`Expected exactly 1 swimlane with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedSwimlaneTitle(title)
    }

    const laned = swimlanes.length > 0

    const handleSubmit = async () =>
    {
        if (!boardId || !cardTitle.trim() || !selectedColumnTitle || (laned && !selectedSwimlaneTitle))
            return

        const column = columns.find(candidate => candidate.title === selectedColumnTitle)
        const swimlane = swimlanes.find(candidate => candidate.title === selectedSwimlaneTitle)
        if (!column || (laned && !swimlane))
            return

        const created = await run('Adding card', () =>
            createCard(boardId, {
                title: cardTitle.trim(),
                description: cardDescription.trim(),
                columnId: column.id,
                swimlaneId: swimlane?.id ?? null,
            })
        )
        if (!created)
            return

        setCardTitle('')
        setCardDescription('')
        setSelectedColumnTitle(null)
        setSelectedSwimlaneTitle(null)
        onClose()
    }

    if (columns.length === 0)
    {
        return (
            <ArcOverlay open={open}
                        onClose={onClose}
                        discardLabel="Close"
                        title="Add a card">
                <Typography sx={{ fontSize: '0.8rem', color: 'arc.onGlass' }}>
                    This board has no columns yet, and a card always sits in one. Add a column first.
                </Typography>
            </ArcOverlay>
        )
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    title="Add a card"
                    titleCaption={laned
                        ? undefined
                        : 'This board has no swimlanes: the card goes straight into its column.'}>
            <Stack spacing={1.5}>
                <TextField {...paperField()}
                           placeholder="Card title"
                           value={cardTitle}
                           onChange={e => setCardTitle(e.target.value)}
                           fullWidth />

                <TextField {...paperField()}
                           placeholder="Card description"
                           value={cardDescription}
                           onChange={e => setCardDescription(e.target.value)}
                           multiline
                           minRows={3}
                           fullWidth />

                {/* Column selector — mirrors @bind-Options="ColumnTitles" */}
                <ArcExpandingSelector options={columns.map(column => column.title)}
                                      onSelect={handleSelectColumn}
                                      placeholder="Select Column" />

                {/* Swimlane selector — mirrors @bind-Options="SwimlaneTitles". Only where there are swimlanes. */}
                { laned && (
                    <ArcExpandingSelector options={swimlanes.map(swimlane => swimlane.title)}
                                          onSelect={handleSelectSwimlane}
                                          placeholder="Select Swimlane" />
                )
                }
            </Stack>
        </ArcOverlay>
    )
}

export default CreateCardOverlay
