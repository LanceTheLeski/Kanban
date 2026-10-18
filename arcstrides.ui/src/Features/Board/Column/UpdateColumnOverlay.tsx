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
 * Reordering rewrites sibling column orders and card positions server-side, so the
 * board is re-read afterwards rather than recomputed locally. See useBoardActions.
 *
 * ── Moving it ────────────────────────────────────────────────────────────────
 * The column is shown among the others in PlacementList, where it is, and is
 * moved by dragging it or clicking a gap — not by choosing a number from a list
 * of numbers. Its place there is its new order, since every column before it
 * is counted.
 *
 * ── Its colours ──────────────────────────────────────────────────────────────
 * As CreateColumnOverlay, starting from what is stored. "Use default" puts it
 * back on the ramp: sent as an empty colour, which the board reads as none —
 * a null would be left out of the server's merge and change nothing.
 */

import React, { useState } from 'react'
import { Stack, TextField } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingPicker } from '../../../Components/ArcExpandingPicker'
import { useArcError } from '../../../Components/useArcError'
import { updateColumn, type OrderedItemPatchRequest } from '../Board.APIs'
import { useBoardActions } from '../Hooks/useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { columnColour, sameColour } from '../Board.Colours'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'
import { PlacementList } from '../ColumnAndSwimlane/PlacementList'
import { GlobalColourPanel } from '../ColumnAndSwimlane/GlobalColourPanel'
import { useColourChoice } from '../Hooks/useColourChoice'

interface UpdateColumnOverlayProps
{
    open: boolean
    onClose: () => void
}

export const UpdateColumnOverlay: React.FC<UpdateColumnOverlayProps> = ({ open, onClose }) =>
{
    const { boardId, columns } = useBoardStore(useShallow(state =>
    ({
        boardId: state.boardId,
        columns: state.columns,
    })))
    const { run } = useBoardActions()
    const { addError } = useArcError()

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [replacementTitle, setReplacementTitle] = useState('')
    const [index, setIndex] = useState(0)

    const selected = columns.find(column => column.id === selectedId) ?? null
    const others = columns.filter(column => column.id !== selectedId)
    const choice = useColourChoice('column', selectedId, null)
    const ramp = columnColour(null, index, columns.length)

    const handleSelectColumn = (title: string) =>
    {
        const matches = columns.filter(column => column.title === title)
        if (matches.length !== 1)
        {
            console.error(`Expected exactly 1 column with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedId(matches[0].id)
        setReplacementTitle(title) // Pre-fill with current title, mirrors Blazor
        setIndex(columns.indexOf(matches[0]))
        // And with its colours, so opening the picker does not read as "no colour"
        // on a column that has one.
        choice.load(matches[0].colour, matches[0].globalColour)
    }

    const handleSubmit = async () =>
    {
        if (!boardId || !selected)
            return

        if (choice.overrideTakenBy)
        {
            addError(`The global colour is "${choice.overrideTakenBy.title}"'s already. Choose another.`)
            return
        }

        const patch: OrderedItemPatchRequest = {}

        if (replacementTitle.trim() && replacementTitle.trim() !== selected.title)
            patch.title = replacementTitle.trim()

        if (index !== selected.order)
            patch.order = index

        if (!sameColour(choice.colour, selected.colour) && (choice.colour || selected.colour))
            patch.colour = choice.colour ?? ''

        if (!sameColour(choice.globalColour, selected.globalColour) && (choice.globalColour || selected.globalColour))
            patch.globalColour = choice.globalColour ?? ''

        if (Object.keys(patch).length === 0)
        {
            onClose()
            return
        }

        const updated = await run('Updating column', () => updateColumn(boardId, selected.id, patch))
        if (!updated)
            return

        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    title="Edit column"
                    titleStock="blue">
            <Stack spacing={1.5}>
                <ArcExpandingPicker options={columns.map(column => column.title)}
                                    onSelect={handleSelectColumn}
                                    placeholder="Select column to edit" />

                { selected && (
                    <>
                        <TextField {...paperField()}
                                   placeholder="New title"
                                   value={replacementTitle}
                                   onChange={e => setReplacementTitle(e.target.value)}
                                   fullWidth />

                        <PlacementList items={others.map(column =>
                        ({ id: column.id,
                           title: column.title,
                           colour: columnColour(column.colour, columns.indexOf(column), columns.length) }))}
                                       moving={{ title: replacementTitle.trim() || selected.title, colour: choice.colour ?? ramp }}
                                       index={index}
                                       onChange={setIndex}
                                       direction="across"
                                       label="Where the column goes" />

                        <ArcColourPicker value={choice.colour}
                                         onChange={choice.pick}
                                         fallback={ramp}
                                         label="Column colour" />

                        <GlobalColourPanel choice={choice}
                                           kind="column"
                                           boardId={boardId} />
                    </>
                )
                }
            </Stack>
        </ArcOverlay>
    )
}

export default UpdateColumnOverlay
