/**
 * CreateTaskTypeOverlay
 *
 * Mirrors: TagGroup/TaskType/CreateTaskTypeOverlay.razor
 *
 * Referenced by both CreateTaskOverlay and UpdateTaskPopover.
 * The Blazor source was not included in the provided files so this is a
 * structural stub that satisfies the import contract used by its consumers.
 */

import React from 'react'
import { Stack, TextField, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'

interface CreateTaskTypeOverlayProps {
    open: boolean
    onClose: () => void
    /** Called after a new TaskType is successfully created */
    onCreated?: () => void
}

export const CreateTaskTypeOverlay: React.FC<CreateTaskTypeOverlayProps> = ({
    open,
    onClose,
    onCreated,
}) => {
    const [title, setTitle] = React.useState('')

    const handleSubmit = async () => {
        // TODO: call createTaskType API
        console.log('[stub] createTaskType', title)
        onCreated?.()
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
                    onChange={e => setTitle(e.target.value)}
                    fullWidth
                />
            </Stack>
        </ArcOverlay>
    )
}

export default CreateTaskTypeOverlay