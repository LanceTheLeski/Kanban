/**
 * UpdateCardOverlay
 *
 * Mirrors: Card/UpdateCardOverlay.razor + UpdateCardOverlay.cs
 *
 * This is the most complex component in the board feature. In Blazor it contained:
 *   - Editable title + description fields bound to ActiveCard
 *   - A task list built as a RenderFragment factory (_taskListRenderFragment)
 *   - Nested CreateTaskOverlay, UpdateTaskPopover per task
 *   - UpdateTimelinePanel
 *   - CommandPanel stub
 *   - Delete card + delete task operations
 *
 * ── RenderFragment elimination ────────────────────────────────────────────────
 * The Blazor _taskListRenderFragment() method was a workaround: Blazor can't
 * conditionally rebuild a list without either a factory method or a full
 * component re-render. React's JSX array map is the native solution — no factory
 * pattern needed.
 *
 * ── Task list mutations ───────────────────────────────────────────────────────
 * Rather than having a separate Refresh() callback refetch the whole board,
 * we manage the task list locally inside this overlay (it's only visible here).
 * The parent (BoardPage) would re-sync on overlay close if needed.
 *
 * ── Patch request ────────────────────────────────────────────────────────────
 * Blazor built a raw JSON Patch string in FormPatchRequestFromOverlay().
 * We use a plain object; the API layer handles serialization.
 *
 * ── Width ─────────────────────────────────────────────────────────────────────
 * The Blazor overlay was 1100px wide. We pass this to ArcOverlay via the
 * width prop.
 */

import React, { useState } from 'react'
import {
    Box,
    Button,
    Grid,
    IconButton,
    List,
    ListItem,
    Paper,
    TextField,
    Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { UpdateTimelinePanel } from '../Timeline/UpdateTimelinePanel'
import { UpdateTaskPopover } from '../Task/UpdateTaskPopover'
import { CreateTaskOverlay } from '../Task/CreateTaskOverlay'
import { CommandPanel } from '../Commands/CommandPanel'
import { deleteCard, deleteTask, updateCard } from '../../../APIs/Board.APIs'
import type { Card, Task } from '../../../Types/Board.Types'

interface UpdateCardOverlayProps {
    open: boolean
    onClose: () => void
    card: Card
    boardId: string
    /** Called after the card is updated or deleted so the parent can re-sync */
    onUpdated?: (updated: Card) => void
    onDeleted?: (cardId: string) => void
}

export const UpdateCardOverlay: React.FC<UpdateCardOverlayProps> = ({
    open,
    onClose,
    card,
    boardId,
    onUpdated,
    onDeleted,
}) => {
    // Local editable copies — mirrors Blazor's @bind-Value="ActiveCard.Title" etc.
    const [title, setTitle] = useState(card.title)
    const [description, setDescription] = useState(card.description)

    // Local task list — owned by this overlay for the duration it's open
    // Mirrors Blazor's _taskList RenderFragment which was rebuilt from ActiveCard.Tasks
    const [tasks, setTasks] = useState<Task[]>(card.tasks)

    const handleSubmit = async () => {
        const patch: { title?: string; description?: string } = {}

        // Only patch fields that changed — mirrors Blazor's FormPatchRequestFromOverlay()
        if (title.trim() && title !== card.title) patch.title = title.trim()
        if (description !== card.description) patch.description = description

        if (Object.keys(patch).length > 0) {
            await updateCard(boardId, card.id, patch)
        }

        onUpdated?.({ ...card, title, description, tasks })
        onClose()
    }

    const handleDeleteCard = async () => {
        await deleteCard(boardId, card.id)
        onDeleted?.(card.id)
        onClose()
    }

    // Mirrors Blazor's DeleteTaskAsync — removes task from API and local list
    const handleDeleteTask = async (taskId: string) => {
        await deleteTask(boardId, card.id, taskId)
        setTasks(prev => prev.filter(t => t.id !== taskId))
    }

    // Called by UpdateTaskPopover when a task's fields are changed
    const handleTaskUpdated = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    }

    // Called by CreateTaskOverlay after a new task is saved
    // TODO: receive the created Task object from the API response and insert it
    const handleTaskCreated = () => {
        // Stub: refetch or optimistically insert once real API returns the task
        console.log('[stub] task created — re-sync task list here')
    }

    return (
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit} width={1100}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* ── Top row: title + tags | description ─────────────────────────── */}
                <Grid container spacing={2}>

                    {/* Left column: title + task list */}
                    <Grid item sx={{ width: 400 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

                            {/* Title + Tags row — mirrors Blazor's MudGrid Spacing="0" */}
                            <Box sx={{ display: 'flex', gap: 1, height: 75, alignItems: 'flex-start' }}>
                                <TextField
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    variant="outlined"
                                    helperText="Card Title"
                                    size="small"
                                    sx={{
                                        width: 240,
                                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                                        borderRadius: 1,
                                    }}
                                />
                                {/* Tags placeholder — mirrors Blazor's "Tags..." paper */}
                                <Paper
                                    sx={{
                                        width: 120,
                                        height: 60,
                                        backgroundColor: 'rgba(204, 255, 204, 0.6)',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography variant="caption">Tags…</Typography>
                                </Paper>
                            </Box>

                            {/* Task list — replaces Blazor's _taskListRenderFragment() */}
                            <Paper
                                className="glass-inner-engraved"
                                sx={{ width: 400, height: 200, overflow: 'auto' }}
                            >
                                <List dense disablePadding>
                                    {tasks.map(task => (
                                        <ListItem key={task.id ?? task.title} disablePadding>
                                            {/* Task popover occupies most of the row width */}
                                            <Box sx={{ width: 350 }}>
                                                <UpdateTaskPopover
                                                    task={task}
                                                    onUpdated={handleTaskUpdated}
                                                    boardId={boardId}
                                                    cardId={card.id}
                                                    tasksCount={tasks.length}
                                                    triggerSize="small"
                                                    triggerStyle={{ width: '100%', justifyContent: 'flex-start' }}
                                                />
                                            </Box>

                                            {/* Delete task icon — mirrors Blazor's trash icon @onclick */}
                                            <IconButton
                                                size="small"
                                                onClick={() => task.id && handleDeleteTask(task.id)}
                                                sx={{ ml: 'auto' }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </ListItem>
                                    ))}

                                    {/* Create task row — mirrors Blazor's <CreateTaskOverlay> in MudListItem */}
                                    <ListItem disablePadding sx={{ pl: 1 }}>
                                        <CreateTaskOverlay
                                            boardId={boardId}
                                            cardId={card.id}
                                            tasksCount={tasks.length}
                                            onCreated={handleTaskCreated}
                                        />
                                    </ListItem>
                                </List>
                            </Paper>
                        </Box>
                    </Grid>

                    {/* Right column: description */}
                    <Grid item sx={{ width: 700 }}>
                        <TextField
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            multiline
                            rows={13}
                            variant="outlined"
                            helperText="Card Description"
                            fullWidth
                            sx={{
                                backgroundColor: 'rgba(255, 255, 230, 0.8)',
                                borderRadius: 1,
                            }}
                        />
                    </Grid>
                </Grid>

                {/* ── Bottom row: timeline + command panel ────────────────────────── */}
                <Grid container spacing={2} alignItems="flex-start">
                    <Grid item>
                        <UpdateTimelinePanel
                            timeline={card.timeline}
                        />
                    </Grid>
                    <Grid item>
                        <CommandPanel />
                    </Grid>
                </Grid>

                {/* ── Delete card action ───────────────────────────────────────────── */}
                {/* Mirrors Blazor's DeleteCardAsync call — placed outside the submit flow */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        onClick={handleDeleteCard}
                    >
                        Delete Card
                    </Button>
                </Box>

            </Box>
        </ArcOverlay>
    )
}

export default UpdateCardOverlay