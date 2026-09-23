/**
 * UpdateSwimlaneOverlay
 *
 * Mirrors: UpdateSwimlaneOverlay.razor + UpdateSwimlaneOverlay.cs
 *
 * Structurally identical to UpdateColumnOverlay — same RemoveAt() bug in the
 * Blazor original, same fix here. See that file for the pattern notes.
 */

import React, { useState } from 'react'
import { Stack, TextField } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { updateSwimlane } from '../Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { swimlaneColour } from '../Board.Colours'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'

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
    const [colour, setColour] = useState<string | null>(null)

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
        // And with its colour, so opening the picker does not read as "no colour"
        // on a swimlane that has one.
        setColour(matches[0].colour)
    }

    const handleSubmit = async () => {
        if (!boardId || !selectedTitle) return

        const swimlane = swimlanes.find(candidate => candidate.title === selectedTitle)
        if (!swimlane) return

        const patch: { title?: string; order?: number; colour?: string; globalColour?: string } = {}

        if (replacementTitle.trim() && replacementTitle !== selectedTitle)
            patch.title = replacementTitle.trim()

        if (selectedOrder !== null && selectedOrder !== swimlane.order)
            patch.order = selectedOrder

        // Only when it changed, and only when it is a colour: clearing back to
        // Default is not expressible as a patch yet, because the operation would
        // have to send null and the server treats null as "leave it alone".
        if (colour && colour !== swimlane.colour) {
            patch.colour = colour
            patch.globalColour = colour
        }

        if (Object.keys(patch).length === 0) {
            onClose()
            return
        }

        const updated = await run('Updating swimlane', () => updateSwimlane(boardId, swimlane.id, patch))
        if (!updated) return

        setSelectedTitle(null)
        setReplacementTitle('')
        setSelectedOrder(null)
        setColour(null)
        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    title="Edit swimlane"
                    titleStock="red">
            <Stack spacing={1.5}>
                <ArcExpandingSelector options={swimlanes.map(swimlane => swimlane.title)}
                                      onSelect={handleSelectSwimlane}
                                      placeholder="Select swimlane to edit" />

<TextField {...paperField()}
                           placeholder="New title"
                           value={replacementTitle}
                           onChange={e => setReplacementTitle(e.target.value)}
                           fullWidth />

                <ArcExpandingSelector options={orderOptions}
                                      onSelect={value => setSelectedOrder(parseInt(value, 10))}
                                      placeholder="Select new order position" />

                <ArcColourPicker value={colour}
                                 onChange={setColour}
                                 fallback={swimlaneColour(null, Math.max(swimlanes.findIndex(swimlane => swimlane.title === selectedTitle), 0), swimlanes.length)}
                                 label="Swimlane colour" />
            </Stack>
        </ArcOverlay>
    )
}

export default UpdateSwimlaneOverlay
