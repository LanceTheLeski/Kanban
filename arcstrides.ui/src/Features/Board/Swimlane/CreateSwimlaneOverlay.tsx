/**
 * CreateSwimlaneOverlay
 *
 * Mirrors: CreateSwimlaneOverlay.razor + CreateSwimlaneOverlay.cs
 *
 * Structurally identical to CreateColumnOverlay — see that file for the pattern
 * notes on useBoardActions, why the board is re-read after a create, and how its
 * place and its colours are chosen. Swimlanes are placed down the list rather
 * than across it, and their suggested shades pale downwards, as the ramp does.
 */

import React, { useState } from 'react'
import { Stack, TextField } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { useArcError } from '../../../Components/useArcError'
import { createSwimlane } from '../Board.APIs'
import { useBoardActions } from '../Hooks/useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { swimlaneColour, suggestedColour } from '../Board.Colours'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'
import { PlacementList } from '../ColumnAndSwimlane/PlacementList'
import { GlobalColourPanel } from '../ColumnAndSwimlane/GlobalColourPanel'
import { useColourChoice } from '../Hooks/useColourChoice'

interface CreateSwimlaneOverlayProps
{
    open: boolean
    onClose: () => void
}

export const CreateSwimlaneOverlay: React.FC<CreateSwimlaneOverlayProps> = ({ open, onClose }) =>
{
    const { boardId, swimlanes } = useBoardStore(useShallow(state =>
    ({
        boardId: state.boardId,
        swimlanes: state.swimlanes,
    })))
    const { run } = useBoardActions()
    const { addError } = useArcError()

    const [title, setTitle] = useState('')
    // At the bottom, which is where most swimlanes go.
    const [index, setIndex] = useState(swimlanes.length)

    const before = swimlanes[index - 1] ?? null
    const after = swimlanes[index] ?? null
    const choice = useColourChoice('swimlane', null, suggestedColour('swimlane', before?.colour ?? null, after?.colour ?? null))
    const ramp = swimlaneColour(null, index, swimlanes.length + 1)

    const handleSubmit = async () =>
    {
        if (!boardId || !title.trim())
            return

        if (choice.overrideTakenBy)
        {
            addError(`The global colour is "${choice.overrideTakenBy.title}"'s already. Choose another.`)
            return
        }

        const created = await run('Adding swimlane', () =>
            createSwimlane(boardId, { title: title.trim(), order: index, colour: choice.colour, globalColour: choice.globalColour })
        )
        if (!created)
            return

        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    dirty={title.trim() !== ''}
                    title="Add a swimlane"
                    titleStock="red">
            <Stack spacing={1.5}>
                <TextField {...paperField()}
                           placeholder="Swimlane title"
                           value={title}
                           onChange={e => setTitle(e.target.value)}
                           fullWidth />

                <PlacementList items={swimlanes.map((swimlane, at) =>
                ({ id: swimlane.id,
                   title: swimlane.title,
                   colour: swimlaneColour(swimlane.colour, at, swimlanes.length) }))}
                               moving={{ title: title.trim() || 'New swimlane', colour: choice.colour ?? ramp }}
                               index={index}
                               onChange={setIndex}
                               direction="down"
                               label="Where the swimlane goes" />

                <ArcColourPicker value={choice.colour}
                                 onChange={choice.pick}
                                 fallback={ramp}
                                 label="Swimlane colour"
                                 hint={choice.suggested
                                     ? hintFor(before?.title ?? null, after?.title ?? null)
                                     : undefined} />

                <GlobalColourPanel choice={choice}
                                   kind="swimlane"
                                   boardId={boardId} />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateSwimlaneOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Where the suggested colour came from, so it does not read as a choice already made. */
function hintFor(before: string | null, after: string | null): string
{
    return before
        ? `Suggested: one shade paler than "${before}", above it.`
        : `Suggested: one shade stronger than "${after}", below it.`
}
