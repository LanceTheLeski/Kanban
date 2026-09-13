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
 *
 * ── Reading this file ────────────────────────────────────────────────────────
 * UpdateCardOverlay comes first and its return is just the arrangement: two
 * columns on top, panels beneath, the delete action last. Each piece is a small
 * component declared further down — function declarations, so they hoist and can
 * sit below the component that uses them.
 *
 * They stay in this file on purpose. None is reusable anywhere else, and pulling
 * them into separate modules would trade one long file for six short ones plus
 * the imports to find them again.
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
import { deleteCard, deleteTask, updateCard } from '../Board.APIs'
import { useBoardStore } from '../Board.Store'
import type { Card } from '../../../Entities/Card/Card.Types'
import type { Task } from '../../../Entities/Task/Task.Types'

// The Blazor original's fixed geometry, named so the arrangement below reads
// without three unexplained numbers in it.
const OVERLAY_WIDTH = 1100
const DETAIL_COLUMN_WIDTH = 400
const DESCRIPTION_COLUMN_WIDTH = 700

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
        <ArcOverlay open={open} onClose={onClose} onSubmit={handleSubmit} width={OVERLAY_WIDTH}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Top row: card detail on the left, description filling the right */}
                <Grid container spacing={2}>
                    <Grid item sx={{ width: DETAIL_COLUMN_WIDTH }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <TitleAndTags title={title} onTitleChange={setTitle} />
                            <TaskList
                                tasks={tasks}
                                boardId={boardId}
                                cardId={card.id}
                                onTaskUpdated={handleTaskUpdated}
                                onTaskCreated={handleTaskCreated}
                                onTaskDeleted={handleDeleteTask}
                            />
                        </Box>
                    </Grid>

                    <Grid item sx={{ width: DESCRIPTION_COLUMN_WIDTH }}>
                        <DescriptionField value={description} onChange={setDescription} />
                    </Grid>
                </Grid>

                <TimelineAndCommands timeline={card.timeline} />

                <DeleteCardAction onDelete={handleDeleteCard} />

            </Box>
        </ArcOverlay>
    )
}

// ── Pieces of the overlay ─────────────────────────────────────────────────────
// Everything below is presentation for the arrangement above. Declared as
// functions so they hoist, which lets the component that composes them be read
// first.

/**
 * Card title beside the tags placeholder.
 * Mirrors Blazor's MudGrid Spacing="0" row at the top of the overlay.
 *
 * Tags are not implemented on either side yet — the Blazor original had the same
 * static "Tags..." paper holding the space.
 */
function TitleAndTags({ title, onTitleChange }: {
    title: string
    onTitleChange: (title: string) => void
}) {
    return (
        <Box sx={{ display: 'flex', gap: 1, height: 75, alignItems: 'flex-start' }}>
            <TextField
                value={title}
                onChange={e => onTitleChange(e.target.value)}
                variant="outlined"
                helperText="Card Title"
                size="small"
                sx={{
                    width: 240,
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 1,
                }}
            />

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
    )
}

/**
 * The card's tasks, each a popover row with a delete button, and a create row at
 * the end. Replaces Blazor's _taskListRenderFragment() factory — a workaround for
 * Blazor not being able to rebuild a list without one.
 */
function TaskList({ tasks, boardId, cardId, onTaskUpdated, onTaskCreated, onTaskDeleted }: {
    tasks: Task[]
    boardId: string
    cardId: string
    onTaskUpdated: (task: Task) => void
    onTaskCreated: (task: Task) => void
    onTaskDeleted: (taskId: string) => void
}) {
    return (
        <Paper className="glass-inner-engraved" sx={{ width: DETAIL_COLUMN_WIDTH, height: 200, overflow: 'auto' }}>
            <List dense disablePadding>
                {tasks.map(task => (
                    <ListItem key={task.id || task.title} disablePadding>
                        {/* The popover trigger takes most of the row; the bin sits at the end */}
                        <Box sx={{ width: 350 }}>
                            <UpdateTaskPopover
                                task={task}
                                onUpdated={onTaskUpdated}
                                boardId={boardId}
                                cardId={cardId}
                                tasksCount={tasks.length}
                                triggerSize="small"
                                triggerStyle={{ width: '100%', justifyContent: 'flex-start' }}
                            />
                        </Box>

                        {/* Mirrors Blazor's trash icon @onclick */}
                        <IconButton
                            size="small"
                            onClick={() => task.id && onTaskDeleted(task.id)}
                            sx={{ ml: 'auto' }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </ListItem>
                ))}

                <ListItem disablePadding sx={{ pl: 1 }}>
                    <CreateTaskOverlay
                        boardId={boardId}
                        cardId={cardId}
                        tasksCount={tasks.length}
                        onCreated={onTaskCreated}
                    />
                </ListItem>
            </List>
        </Paper>
    )
}

/** The card description, filling the right-hand column. */
function DescriptionField({ value, onChange }: {
    value: string
    onChange: (description: string) => void
}) {
    return (
        <TextField
            value={value}
            onChange={e => onChange(e.target.value)}
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
    )
}

/**
 * The two panels along the bottom of the overlay.
 *
 * The timeline panel is read-only here: a card's own timeline is displayed, but
 * only a *task's* timeline can currently be edited (see UpdateTaskPopover).
 * CommandPanel is still the layout stub it was in Blazor.
 */
function TimelineAndCommands({ timeline }: { timeline: Card['timeline'] }) {
    return (
        <Grid container spacing={2} alignItems="flex-start">
            <Grid item>
                <UpdateTimelinePanel timeline={timeline} />
            </Grid>
            <Grid item>
                <CommandPanel />
            </Grid>
        </Grid>
    )
}

/**
 * Deleting sits apart from the overlay's Submit/Discard group on purpose —
 * mirrors Blazor, where DeleteCardAsync was outside the submit flow.
 */
function DeleteCardAction({ onDelete }: { onDelete: () => void }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button color="error" variant="outlined" size="small" onClick={onDelete}>
                Delete Card
            </Button>
        </Box>
    )
}

export default UpdateCardOverlay
