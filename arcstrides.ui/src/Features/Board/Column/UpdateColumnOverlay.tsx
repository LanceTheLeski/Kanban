/**
 * UpdateColumnOverlay
 *
 * Mirrors: UpdateColumnOverlay.razor + UpdateColumnOverlay.cs
 *
 * Notable fix from the Blazor version:
 *   The Blazor cs partial class called Columns.RemoveAt() and ColumnTitles.RemoveAt()
 *   after an update but never re-inserted, leaving the UI with one fewer column.
 *   The comment literally said "This is not actually what we want."
 *
 * The Blazor version used OnParametersSet() to regenerate the order list whenever
 * columns changed. Here we derive it from the store directly in render — no lifecycle
 * hook needed because store subscriptions are reactive.
 *
 * Reordering rewrites sibling column orders and card positions server-side, so the
 * board is re-read afterwards rather than recomputed locally. See useBoardActions.
 */

import React, { useState } from 'react'
import { Stack, TextField } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { updateColumn } from '../Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { columnSwatches } from '../Board.Colours'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'

interface UpdateColumnOverlayProps {
    open: boolean
    onClose: () => void
}

export const UpdateColumnOverlay: React.FC<UpdateColumnOverlayProps> = ({ open, onClose }) => {
    const { boardId, columns } = useBoardStore(useShallow(state => ({
        boardId: state.boardId,
        columns: state.columns,
    })))
    const { run } = useBoardActions()

    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
    const [replacementTitle, setReplacementTitle] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null)
    const [colour, setColour] = useState<string | null>(null)

    // Derived from store — mirrors Blazor's GetColumnIndexList() / OnParametersSet()
    // but reactive: always reflects current column count
    const orderOptions = columns.map((_, index) => String(index))

    const handleSelectColumn = (title: string) => {
        const matches = columns.filter(column => column.title === title)
        if (matches.length !== 1) {
            console.error(`Expected exactly 1 column with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedTitle(title)
        setReplacementTitle(title) // Pre-fill with current title, mirrors Blazor
        // And with its colour, so opening the picker does not read as "no colour"
        // on a column that has one.
        setColour(matches[0].colour)
    }

    const handleSubmit = async () => {
        if (!boardId || !selectedTitle) return

        const column = columns.find(candidate => candidate.title === selectedTitle)
        if (!column) return

        const patch: { title?: string; order?: number; colour?: string; globalColour?: string } = {}

        if (replacementTitle.trim() && replacementTitle !== selectedTitle)
            patch.title = replacementTitle.trim()

        if (selectedOrder !== null && selectedOrder !== column.order)
            patch.order = selectedOrder

        // Only when it changed, and only when it is a colour: clearing back to
        // Default is not expressible as a patch yet, because the operation would
        // have to send null and the server treats null as "leave it alone".
        if (colour && colour !== column.colour) {
            patch.colour = colour
            patch.globalColour = colour
        }

        if (Object.keys(patch).length === 0) {
            onClose()
            return
        }

        const updated = await run('Updating column', () => updateColumn(boardId, column.id, patch))
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
                    title="Edit column"
                    titleStock="blue">
            <Stack spacing={1.5}>
                <ArcExpandingSelector options={columns.map(column => column.title)}
                                      onSelect={handleSelectColumn}
                                      placeholder="Select column to edit" />

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
                                 swatches={columnSwatches()}
                                 label="Column colour" />
            </Stack>
        </ArcOverlay>
    )
}

export default UpdateColumnOverlay
