/**
 * CreateColumnOverlay
 *
 * Mirrors: CreateColumnOverlay.razor + CreateColumnOverlay.cs
 *
 * ── Pattern used by all six column/swimlane overlays ─────────────────────────
 * Every mutation goes through useBoardActions().run(), which surfaces failures in
 * the snackbar and re-reads the board on success. The overlay only closes when the
 * call actually succeeded, so a failed request leaves the user's input in place
 * instead of discarding it.
 *
 * The board is re-read rather than patched locally because inserting a column at a
 * given order shifts the order of every column after it *and* rewrites the affected
 * card positions server-side — see the note at the top of Board.Store.ts.
 *
 * ── Where it goes ────────────────────────────────────────────────────────────
 * Chosen among the columns there are (PlacementList), at the end unless moved —
 * the Order field it replaces asked for a number to count to.
 *
 * ── Its colour ───────────────────────────────────────────────────────────────
 * Offered the next shade along from the column before it, when that one has a
 * colour of its own, and following its place as it moves until one is picked
 * (Board.Colours, suggestedColour). Its global colour is the same unless that
 * is taken by another column, on any board; then GlobalColourPanel asks for
 * another. See useColourChoice.
 */

import React, { useState } from 'react'
import { Stack, TextField } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { useArcError } from '../../../Components/useArcError'
import { createColumn } from '../Board.APIs'
import { useBoardActions } from '../useBoardActions'
import { useShallow } from 'zustand/react/shallow'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { columnColour, suggestedColour } from '../Board.Colours'
import { paperField } from '../../../Styles/Paper'
import { useBoardStore } from '../Board.Store'
import { PlacementList } from '../PlacementList'
import { GlobalColourPanel } from '../GlobalColourPanel'
import { useColourChoice } from '../useColourChoice'

interface CreateColumnOverlayProps
{
    open: boolean
    onClose: () => void
}

export const CreateColumnOverlay: React.FC<CreateColumnOverlayProps> = ({ open, onClose }) =>
{
    const { boardId, columns } = useBoardStore(useShallow(state =>
    ({
        boardId: state.boardId,
        columns: state.columns,
    })))
    const { run } = useBoardActions()
    const { addError } = useArcError()

    const [title, setTitle] = useState('')
    // At the end, which is where most columns go.
    const [index, setIndex] = useState(columns.length)

    const before = columns[index - 1] ?? null
    const after = columns[index] ?? null
    const choice = useColourChoice('column', null, suggestedColour('column', before?.colour ?? null, after?.colour ?? null))
    const ramp = columnColour(null, index, columns.length + 1)

    const handleSubmit = async () =>
    {
        if (!boardId || !title.trim())
            return

        if (choice.overrideTakenBy)
        {
            addError(`The global colour is "${choice.overrideTakenBy.title}"'s already. Choose another.`)
            return
        }

        const created = await run('Adding column', () =>
            createColumn(boardId, { title: title.trim(), order: index, colour: choice.colour, globalColour: choice.globalColour })
        )
        if (!created)
            return

        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    title="Add a column"
                    titleStock="blue">
            <Stack spacing={1.5}>
                <TextField {...paperField()}
                           placeholder="Column title"
                           value={title}
                           onChange={e => setTitle(e.target.value)}
                           fullWidth />

                <PlacementList items={columns.map((column, at) =>
                ({ id: column.id,
                   title: column.title,
                   colour: columnColour(column.colour, at, columns.length) }))}
                               moving={{ title: title.trim() || 'New column', colour: choice.colour ?? ramp }}
                               index={index}
                               onChange={setIndex}
                               direction="across"
                               label="Where the column goes" />

                <ArcColourPicker value={choice.colour}
                                 onChange={choice.pick}
                                 fallback={ramp}
                                 label="Column colour"
                                 hint={choice.suggested
                                     ? hintFor(before?.title ?? null, after?.title ?? null)
                                     : undefined} />

                <GlobalColourPanel choice={choice}
                                   kind="column"
                                   boardId={boardId} />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateColumnOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** Where the suggested colour came from, so it does not read as a choice already made. */
function hintFor(before: string | null, after: string | null): string
{
    return before
        ? `Suggested: one shade deeper than "${before}", beside it.`
        : `Suggested: one shade paler than "${after}", beside it.`
}
