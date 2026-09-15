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
    IconButton,
    List,
    ListItem,
    Paper,
    TextField,
    Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcSplitPane } from '../../../Components/ArcSplitPane'
import { UpdateTimelinePanel } from '../Timeline/UpdateTimelinePanel'
import { UpdateTaskPopover } from '../Task/UpdateTaskPopover'
import { CreateTaskOverlay } from '../Task/CreateTaskOverlay'
import { CommandPanel } from '../Commands/CommandPanel'
import { useBoardActions } from '../useBoardActions'
import { deleteCard, deleteTask, updateCard } from '../Board.APIs'
import { useBoardStore } from '../Board.Store'
import { TagsPanel, type CardTag } from './TagsPanel'
import {
    CARD_DETAIL_ROW_MIN_HEIGHT,
    CARD_LEFT_PANE_MIN_REM,
    CARD_PANEL_ROW_MAX_HEIGHT,
    CARD_PANEL_ROW_MIN_HEIGHT,
    CARD_RIGHT_PANE_MIN_REM,
    CARD_SPLIT_DEFAULT,
    TASK_LIST_MIN_HEIGHT,
    TITLE_ROW_MIN_HEIGHT,
} from '../../../Styles/Measures'
import type { Card } from '../../../Entities/Card/Card.Types'
import type { Task } from '../../../Entities/Task/Task.Types'

// The Blazor original was 1100px wide with a 400px and a 700px column. Only the
// overall width is still a pixel value — and it is a *maximum*, not a size.
//
// The 4:7 those numbers described is now only where the split *starts*
// (CARD_SPLIT_DEFAULT): the reader drags the bar between the two panes from
// there. See ArcSplitPane.
const OVERLAY_MAX_WIDTH = 1100

// Below this the two columns stop being readable side by side and stack.
const STACK_BELOW = 'md'

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

    // Local only. The API can create and delete tags but cannot list the ones on
    // a card, so there is nothing to seed this from and nowhere to send it that
    // could be read back. See TagsPanel for what would unblock it.
    const [tags, setTags] = useState<CardTag[]>([])

    /**
     * How the overlay's width is divided between the card's detail and its
     * description.
     *
     * Local, and therefore per-opening: drag the bar, close the card, reopen it
     * and it is back at the default. That is deliberate for now — the point is to
     * see whether the control is worth having before adding a column to store it
     * in. It is a single number, so making it stick later means seeding this from
     * the card and patching it on save; nothing else has to change.
     */
    const [split, setSplit] = useState(CARD_SPLIT_DEFAULT)

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
        <ArcOverlay
            open={open}
            onClose={onClose}
            onSubmit={handleSubmit}
            width={OVERLAY_MAX_WIDTH}
            // Delete used to be a button inside the overlay's content, above the
            // action group — the one destructive action on the board, in a place
            // no other overlay put anything. It is now in the bar, at the far
            // left, and confirms before it runs.
            onDelete={handleDeleteCard}
            deleteLabel="Delete Card"
            deleteConfirm={`Delete "${card.title}" and its tasks?`}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/*
                    Top row: card detail on the left, description filling the right.

                    `alignItems: stretch` rather than `start` is what makes the two
                    columns end level. With `start` each column sized to its own
                    content — a fixed 200px task list on the left against a 13-row
                    textarea on the right — so the left column stopped 70px above
                    the right and the dialog read as unbalanced. Both columns now
                    fill the row, and the row has a floor so a sparse card does not
                    produce a different shape of dialog from a full one.
                */}
                <Box sx={{ minHeight: CARD_DETAIL_ROW_MIN_HEIGHT, display: 'flex', flexDirection: 'column' }}>
                    <ArcSplitPane
                        ratio={split}
                        onRatioChange={setSplit}
                        minLeftRem={CARD_LEFT_PANE_MIN_REM}
                        minRightRem={CARD_RIGHT_PANE_MIN_REM}
                        // A card that is only a checklist should be able to drop
                        // the description entirely rather than keep a sliver of it.
                        collapsibleRight
                        resetRatio={CARD_SPLIT_DEFAULT}
                        stackBelow={STACK_BELOW}
                        label="Resize card detail and description"
                        left={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, minHeight: 0, flex: 1, pr: 1 }}>
                                <TitleAndTags
                                    title={title}
                                    onTitleChange={setTitle}
                                    tags={tags}
                                    onTagsChange={setTags}
                                />
                                <TaskList
                                    tasks={tasks}
                                    boardId={boardId}
                                    cardId={card.id}
                                    onTaskUpdated={handleTaskUpdated}
                                    onTaskCreated={handleTaskCreated}
                                    onTaskDeleted={handleDeleteTask}
                                />
                            </Box>
                        }
                        right={
                            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, flex: 1, pl: 1 }}>
                                <DescriptionField value={description} onChange={setDescription} />
                            </Box>
                        }
                    />
                </Box>

                {/*
                    Bottom row: the timeline beside the card's log. Two equal
                    columns that stretch, for the same reason as above — these were
                    a wrapping flex row where each panel sized itself, which left a
                    ragged edge and a hole under the timeline's mode buttons.
                */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', [STACK_BELOW]: 'minmax(0, 1fr) minmax(0, 1fr)' },
                        gap: 2,
                        alignItems: 'stretch',
                        minHeight: CARD_PANEL_ROW_MIN_HEIGHT,
                        maxHeight: { [STACK_BELOW]: CARD_PANEL_ROW_MAX_HEIGHT },
                    }}
                >
                    <UpdateTimelinePanel timeline={card.timeline} />
                    <CommandPanel card={card} />
                </Box>

            </Box>
        </ArcOverlay>
    )
}

// ── Pieces of the overlay ─────────────────────────────────────────────────────
// Everything below is presentation for the arrangement above. Declared as
// functions so they hoist, which lets the component that composes them be read
// first.

/**
 * Card title beside its tags.
 *
 * Mirrors Blazor's MudGrid Spacing="0" row at the top of the overlay, which put
 * a fixed 120x60 "Tags…" placeholder to the right of the title. That position
 * was right; only what sat in it was a placeholder. The tags are real now and
 * still live there, small.
 */
function TitleAndTags({ title, onTitleChange, tags, onTagsChange }: {
    title: string
    onTitleChange: (title: string) => void
    tags: CardTag[]
    onTagsChange: (tags: CardTag[]) => void
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1,
                flexShrink: 0,
                minHeight: TITLE_ROW_MIN_HEIGHT,
                // The title grows with its content now, so the tags box tracks
                // its height rather than the two disagreeing.
                alignItems: 'stretch',
            }}
        >
            <TextField
                value={title}
                onChange={e => onTitleChange(e.target.value)}
                variant="outlined"
                helperText="Card Title"
                size="small"
                /*
                   Multiline, up to three lines.

                   A single-line input shows a long title as whatever fits and
                   scrolls the rest out of sight — so the field could hold a title
                   the reader could not read back without dragging through it. A
                   card title is a sentence often enough that this was the common
                   case, not the edge one.

                   Three lines rather than unbounded: past that the title is
                   taking room from the task list underneath, and what is wanted
                   is a description.
                */
                multiline
                maxRows={3}
                // minWidth: 0 stops the input's intrinsic width propping the row open.
                sx={{ flex: 1, minWidth: 0, backgroundColor: 'arc.field', borderRadius: 1 }}
            />

            <TagsPanel tags={tags} onChange={onTagsChange} />
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
        <Paper
            className="glass-inner-engraved"
            /*
               Takes the height the column has left rather than claiming a fixed
               200px. That fixed height was what made the left column end short of
               the description beside it. minHeight keeps it a usable target when
               the row is at its floor; it scrolls past that.
            */
            sx={{
                width: '100%',
                flex: 1,
                minHeight: TASK_LIST_MIN_HEIGHT,
                overflow: 'auto',
            }}
        >
            <List dense disablePadding>
                {tasks.length === 0 && (
                    <ListItem disablePadding sx={{ px: 1, py: 1.5 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'arc.onGlassMuted' }}>
                            No tasks on this card yet.
                        </Typography>
                    </ListItem>
                )}

                {tasks.map(task => (
                    <ListItem key={task.id || task.title} disablePadding>
                        {/* The popover trigger takes the row; the bin sits at the end */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                            sx={{ flexShrink: 0 }}
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

/**
 * The card description, filling the right-hand column.
 *
 * `rows={13}` is gone. A fixed row count made the description the thing that
 * decided how tall the whole top row was, and 13 rows is not a number anyone
 * chose — it was whatever happened to look right next to a 200px task list.
 *
 * Making a multiline TextField fill its container takes three rules, because
 * MUI sizes the textarea from its content by default:
 *   - the FormControl becomes a flex column, so the helper text sits under a
 *     growing input rather than being pushed out of the box
 *   - the InputBase takes the remaining height
 *   - the textarea fills the InputBase and scrolls its own overflow
 *
 * `:not([aria-hidden])` matters: an autosizing MUI textarea has a second,
 * hidden textarea used to measure content, and forcing that one to 100% height
 * makes it report a height that grows every render.
 */
function DescriptionField({ value, onChange }: {
    value: string
    onChange: (description: string) => void
}) {
    return (
        <TextField
            value={value}
            onChange={e => onChange(e.target.value)}
            multiline
            variant="outlined"
            helperText="Card Description"
            fullWidth
            sx={{
                backgroundColor: 'arc.fieldMuted',
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                '& .MuiInputBase-root': {
                    flex: 1,
                    minHeight: 0,
                    alignItems: 'flex-start',
                },
                '& textarea:not([aria-hidden])': {
                    height: '100% !important',
                    overflow: 'auto !important',
                },
            }}
        />
    )
}


export default UpdateCardOverlay
