/**
 * UpdateSwimlaneOverlay
 *
 * Mirrors: UpdateSwimlaneOverlay.razor + UpdateSwimlaneOverlay.cs
 *
 * Structurally identical to UpdateColumnOverlay — same RemoveAt() bug in the
 * Blazor original, same fix here, and the same way of moving it and colouring
 * it. See that file for the pattern notes.
 */

import React, { useState } from 'react'
import { Stack, TextField } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcExpandingPicker } from '../../../Components/ArcExpandingPicker'
import { useArcError } from '../../../Components/useArcError'
import { updateSwimlane, type OrderedItemPatchRequest } from '../Board.APIs'
import { useBoardActions } from '../Hooks/useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { swimlaneColour, sameColour } from '../Board.Colours'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'
import { PlacementList } from '../ColumnAndSwimlane/PlacementList'
import { GlobalColourPanel } from '../ColumnAndSwimlane/GlobalColourPanel'
import { useColourChoice } from '../Hooks/useColourChoice'

interface UpdateSwimlaneOverlayProps
{
    open: boolean
    onClose: () => void
}

export const UpdateSwimlaneOverlay: React.FC<UpdateSwimlaneOverlayProps> = ({ open, onClose }) =>
{
    const { boardId, swimlanes } = useBoardStore(useShallow(state =>
    ({
        boardId: state.boardId,
        swimlanes: state.swimlanes,
    })))
    const { run } = useBoardActions()
    const { addError } = useArcError()

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [replacementTitle, setReplacementTitle] = useState('')
    const [index, setIndex] = useState(0)

    const selected = swimlanes.find(swimlane => swimlane.id === selectedId) ?? null
    const others = swimlanes.filter(swimlane => swimlane.id !== selectedId)
    const choice = useColourChoice('swimlane', selectedId, null)
    const ramp = swimlaneColour(null, index, swimlanes.length)

    const handleSelectSwimlane = (title: string) =>
    {
        const matches = swimlanes.filter(swimlane => swimlane.title === title)
        if (matches.length !== 1)
        {
            console.error(`Expected exactly 1 swimlane with title "${title}", found ${matches.length}`)
            return
        }
        setSelectedId(matches[0].id)
        setReplacementTitle(title) // Pre-fill with current title, mirrors Blazor
        setIndex(swimlanes.indexOf(matches[0]))
        // And with its colours, so opening the picker does not read as "no colour"
        // on a swimlane that has one.
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

        const updated = await run('Updating swimlane', () => updateSwimlane(boardId, selected.id, patch))
        if (!updated)
            return

        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    title="Edit swimlane"
                    titleStock="red">
            <Stack spacing={1.5}>
                <ArcExpandingPicker options={swimlanes.map(swimlane => swimlane.title)}
                                    onSelect={handleSelectSwimlane}
                                    placeholder="Select swimlane to edit" />

                { selected && (
                    <>
                        <TextField {...paperField()}
                                   placeholder="New title"
                                   value={replacementTitle}
                                   onChange={e => setReplacementTitle(e.target.value)}
                                   fullWidth />

                        <PlacementList items={others.map(swimlane =>
                        ({ id: swimlane.id,
                           title: swimlane.title,
                           colour: swimlaneColour(swimlane.colour, swimlanes.indexOf(swimlane), swimlanes.length) }))}
                                       moving={{ title: replacementTitle.trim() || selected.title, colour: choice.colour ?? ramp }}
                                       index={index}
                                       onChange={setIndex}
                                       direction="down"
                                       label="Where the swimlane goes" />

                        <ArcColourPicker value={choice.colour}
                                         onChange={choice.pick}
                                         fallback={ramp}
                                         label="Swimlane colour" />

                        <GlobalColourPanel choice={choice}
                                           kind="swimlane"
                                           boardId={boardId} />
                    </>
                )
                }
            </Stack>
        </ArcOverlay>
    )
}

export default UpdateSwimlaneOverlay
