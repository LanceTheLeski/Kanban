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
 * ── Editable state and the card prop ────────────────────────────────────────
 * BoardCard mounts this only while it is open, so the useState initialisers below
 * re-run on every open and the draft always starts from the current card. That
 * replaces Blazor's Fire() callback, which re-seeded the fields by hand.
 *
 * Mounting on demand also matters for the board as a whole: this overlay pulls in
 * the timeline pickers, the task popovers and a task-types fetch, and an earlier
 * version kept one instance alive for every card on the board.
 *
 * ── Patch request ────────────────────────────────────────────────────
 * Blazor built a raw JSON Patch string in FormPatchRequestFromOverlay() and sent
 * it to the card *position* endpoint, which ignores Title and Description — card
 * edits never actually persisted. This now patches the card itself through
 * CardController.UpdateCard.
 *
 * ── Width ──────────────────────────────────────────────────────────
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
import { useBoardActions } from '../useBoardActions'
import { deleteCard, deleteTask, updateCard } from '../../../APIs/Board.APIs'
import { useBoardStore } from '../../../Stores/BoardStores'
import type { Card, Task } from '../../../Types/Board.Types'

interface UpdateCardOverlayProps {
    open: boolean
    onClose: () => void
    card: Card
    boardId: string
}

export const UpdateCardOverlay: React.FC<UpdateCardOverlayProps> = ({
    open,
    onClose,
    card,
    boardId,
}) => {
    const { run } = useBoardActions()
    const replaceCard = useBoardStore(state => state.replaceCard)
    const removeCard = useBoardStore(state => state.removeCard)

    // Local editable copies — mirrors Blazor's @bind-Value="ActiveCard.Title" etc.
    const [title, setTitle] = useState(card.title)
    const [description, setDescription] = useState(card.description)

    // Local task list, owned by this overlay while it is open.
    // Mirrors Blazor's _taskList RenderFragment, which was rebuilt from ActiveCard.Tasks.
    const [tasks, setTasks] = useState<Task[]>(card.tasks)

    const handleSubmit = async () => {
        const patch: { title?: string; description?: string } = {}

        // Only patch fields that changed — mirrors Blazor's FormPatchRequestFromOverlay()
        if (title.trim() && title !== card.title) patch.title = title.trim()
        if (description !== card.description) patch.description = description

        if (Object.keys(patch).length === 0) {
            onClose()
            return
        }

        const updated = await run(
            'Saving card',
            () => updateCard(boardId, card.id, patch),
            // The card is patched in local state below; nothing else on the board moved.
            { refresh: false }
        )
        if (!updated) return

        replaceCard({
            ...card,
            title: patch.title ?? card.title,
            description: patch.description ?? card.description,
            tasks,
        })
        onClose()
    }

    const handleDeleteCard = async () => {
        const deleted = await run(
            `Deleting "${card.title}"`,
            () => deleteCard(boardId, card.id),
            { refresh: false }
        )
        if (!deleted) return

        removeCard(card.id)
        onClose()
    }

    // Mirrors Blazor's DeleteTaskAsync — removes the task server-side, then locally
    const handleDeleteTask = async (taskId: string) => {
        const deleted = await run(
            'Deleting task',
            () => deleteTask(boardId, card.id, taskId),
            { refresh: false }
        )
        if (!deleted) return

        const remaining = tasks.filter(task => task.id !== taskId)
        setTasks(remaining)
        replaceCard({ ...card, tasks: remaining })
    }

    // Called by UpdateTaskPopover when a task's fields are changed
    const handleTaskUpdated = (updatedTask: Task) => {
        const next = tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
        setTasks(next)
        replaceCard({ ...card, tasks: next })
    }

    // Called by CreateTaskOverlay with the task the server assigned an ID to
    const handleTaskCreated = (createdTask: Task) => {
        const next = [...tasks, createdTask].sort((a, b) => a.order - b.order)
        setTasks(next)
        replaceCard({ ...card, tasks: next })
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