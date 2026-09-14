/**
 * CreateTaskTypeOverlay
 *
 * Mirrors: TagGroup/TaskType/CreateTaskTypeOverlay.razor
 *
 * Referenced by both CreateTaskOverlay and UpdateTaskPopover.
 *
 * ── This used to be a stub ───────────────────────────────────────────────────
 * The Blazor source for this overlay was not among the files provided during the
 * conversion, so it shipped as a shape that satisfied its callers' imports: it
 * logged the title to the console and reported success. Two symptoms came from
 * that one gap, and neither pointed at it.
 *
 * The new type never reached the server, so it never appeared in the dropdown —
 * which read as a refresh bug, since the caller does refetch on close. And with
 * nothing to select, the task form fell back to a sentinel task type ID, which
 * the API rejected on submit with "The TaskTypeID passed in does not exist in
 * the service" — which read as a server problem.
 *
 * It now creates the type and hands it back, so the caller can select it rather
 * than refetching and matching on title.
 *
 * Failures go through useBoardActions().run() like every other mutation, so they
 * surface in the snackbar. `refresh: false` because a task type is not board
 * state — reloading the board would be a wasted round trip.
 */

import React, { useState } from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { createTaskType } from '../../Board/Board.APIs'
import { useBoardActions } from '../../Board/useBoardActions'
import type { TaskType } from '../../../Entities/Task/Task.Types'

interface CreateTaskTypeOverlayProps {
    open: boolean
    onClose: () => void
    /** The newly created type, so the caller can select it straight away. */
    onCreated?: (taskType: TaskType) => void
}

export const CreateTaskTypeOverlay: React.FC<CreateTaskTypeOverlayProps> = ({
    open,
    onClose,
    onCreated,
}) => {
    const { run } = useBoardActions()
    const [title, setTitle] = useState('')

    const handleSubmit = async () => {
        const trimmed = title.trim()
        if (!trimmed) return

        // run() reports success as a boolean, so the created type is carried out
        // through a holder rather than a plain `let` — TypeScript narrows a `let`
        // initialised to null and would not believe the callback had assigned it.
        const created: { value: TaskType | null } = { value: null }

        const succeeded = await run(
            'Adding task type',
            async () => { created.value = await createTaskType(trimmed) },
            { refresh: false },
        )
        if (!succeeded || !created.value) return

        onCreated?.(created.value)
        setTitle('')
        onClose()
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <Typography variant="h6">Create New Task Type</Typography>

                <TextField
                    label="Title"
                    variant="filled"
                    helperText="Task Type Name"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    fullWidth
                    autoFocus
                />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateTaskTypeOverlay
