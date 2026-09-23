/**
 * CreateSwimlaneOverlay
 *
 * Mirrors: CreateSwimlaneOverlay.razor + CreateSwimlaneOverlay.cs
 *
 * Structurally identical to CreateColumnOverlay — see that file for the pattern
 * notes on useBoardActions and why the board is re-read after a create.
 */

import React, { useState } from 'react'
import { Stack, TextField } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { createSwimlane } from '../Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { swimlaneColour, landingIndex } from '../Board.Colours'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'

interface CreateSwimlaneOverlayProps {
    open: boolean
    onClose: () => void
}

export const CreateSwimlaneOverlay: React.FC<CreateSwimlaneOverlayProps> = ({ open, onClose }) => {
    const { boardId, swimlanes } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        swimlanes: state.swimlanes,
    })))
    const { run } = useBoardActions()

    const [title, setTitle] = useState('')
    const [orderInput, setOrderInput] = useState('')
    const [colour, setColour] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!boardId || !title.trim()) return

        // Mirror Blazor fallback: if no order given, append at end
        const order = orderInput.trim() !== '' ? parseInt(orderInput, 10) : swimlanes.length

        const created = await run('Adding swimlane', () =>
            createSwimlane(boardId, { title: title.trim(), order, colour, globalColour: colour })
        )
        if (!created) return

        setTitle('')
        setOrderInput('')
        setColour(null)
        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    title="Add a swimlane"
                    titleStock="red">
            <Stack spacing={1.5}>
                <TextField {...paperField()}
                           placeholder="Swimlane title"
                           value={title}
                           onChange={e => setTitle(e.target.value)}
                           fullWidth />

                <TextField {...paperField()}
                           placeholder="Order"
                           helperText={`Leave blank to append at position ${swimlanes.length}`}
                           value={orderInput}
                           onChange={e => setOrderInput(e.target.value)}
                           inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                           fullWidth />

                <ArcColourPicker value={colour}
                                 onChange={setColour}
                                 fallback={swimlaneColour(null, landingIndex(orderInput, swimlanes.length), swimlanes.length + 1)}
                                 label="Swimlane colour" />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateSwimlaneOverlay
