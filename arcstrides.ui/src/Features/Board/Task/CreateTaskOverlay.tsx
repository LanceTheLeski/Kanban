/**
 * CreateTaskOverlay
 *
 * Mirrors: Task/CreateTaskOverlay.razor + CreateTaskOverlay.cs
 *
 * The Blazor version used MudPopover directly (not ArcPopover). The comment
 * said "This should ideally be a component one day." We use ArcPopover here
 * for consistency with UpdateTaskPopover — it's the right primitive for
 * trigger-button → popover-content flows.
 *
 * ── Task initialization ───────────────────────────────────────────────────────
 * Blazor initialized a Task in OnInitialized() with Title = "Create New Task"
 * which served as the button label. ArcPopover's triggerLabel prop handles that.
 *
 * ── Task type fetching ────────────────────────────────────────────────────────
 * Blazor called FetchTaskTypesAsync() in OnAfterRenderAsync(firstRender).
 * We use a useEffect with an empty dependency array — the React equivalent of
 * "run once after first render."
 *
 * ── The TasksCount prop ───────────────────────────────────────────────────────
 * Used to build the order range dropdown (1..N). In Blazor this was an int
 * parameter. Here we receive it as a prop from UpdateCardOverlay which knows
 * the current task count.
 */

import React, { useEffect, useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { TextField } from '@mui/material'
import { ArcPopover } from '../../../Components/ArcPopover'
import { TASK_PANEL_ROW_MIN_HEIGHT } from '../../../Styles/Measures'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { UpdateTimelinePanel } from '../Timeline/UpdateTimelinePanel'
import { CreateTaskTypeOverlay } from '../../TagGroup/TaskType/CreateTaskTypeOverlay'
import { useBoardActions } from '../useBoardActions'
import { useArcError } from '../../../Components/useArcError'
import {
    draftToTimelineDates,
    hasTimeline,
    TIMELINE_PARENT_TASK,
    type TimelineDraft,
} from '../Timeline/Timeline.Draft'
import { createTask, createTimeline, fetchTaskTypes } from '../Board.APIs'
import type { Task, TaskType } from '../../../Entities/Task/Task.Types'

interface CreateTaskOverlayProps {
    boardId: string
    cardId: string
    /** Current task count — used to build the order range 1..N */
    tasksCount: number
    /** Receives the task the server created, so the parent can insert it into its list */
    onCreated?: (task: Task) => void
}

export const CreateTaskOverlay: React.FC<CreateTaskOverlayProps> = ({
    boardId,
    cardId,
    tasksCount,
    onCreated,
}) => {
    const [title, setTitle] = useState('')
    const [isCompleted, setIsCompleted] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(tasksCount)
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
    const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<number | null>(null)
    const [timelineDraft, setTimelineDraft] = useState<TimelineDraft | null>(null)

    const [createTaskTypeOpen, setCreateTaskTypeOpen] = useState(false)

    const { run } = useBoardActions()
    const { addError } = useArcError()

    // Mirrors Blazor's OnAfterRenderAsync(firstRender)
    useEffect(() => {
        fetchTaskTypes([0])
            .then(setTaskTypes)
            .catch(error => console.error('Could not load task types', error))
    }, [])

    // Order range 1..N — mirrors Blazor's _taskOrderRange initialization
    const orderOptions = Array.from({ length: tasksCount }, (_, i) => String(i + 1))

    const handleSetTaskType = (typeName: string) => {
        const matches = taskTypes.filter(taskType => taskType.title === typeName)
        if (matches.length !== 1) {
            console.error(`Task type "${typeName}" not uniquely found`)
            return
        }
        setSelectedTaskTypeId(matches[0].id)
    }

    const handleSubmit = async () => {
        // -1 used to go out here when nothing was selected, and the API answered
        // "The TaskTypeID passed in does not exist in the service" — technically
        // true, and useless. Ask for the missing field instead of inventing one.
        if (selectedTaskTypeId === null) {
            addError('Pick a task type before adding the task.')
            // false, so the popover stays open on the field that is missing.
            // Returning nothing closed it — telling the user what was wrong and
            // then throwing away everything they had typed to fix it.
            return false
        }

        let created: Task | null = null

        const succeeded = await run(
            'Adding task',
            async () => {
                created = await createTask(boardId, cardId, {
                    title: title.trim() || 'New Task',
                    taskTypeId: selectedTaskTypeId,
                    order: selectedOrder,
                    isComplete: isCompleted,
                })

                // The create endpoint takes no timeline, so a task that was given
                // dates needs a follow-up POST parented to the new task —
                // mirrors CreateTimelineAsync() in the Blazor overlay.
                if (!hasTimeline(timelineDraft)) return

                const timeline = await createTimeline(boardId, {
                    parentId: created.id,
                    // The parent kind, not the mode — see timelineDraft.
                    timelineTypeId: TIMELINE_PARENT_TASK,
                    ...draftToTimelineDates(timelineDraft),
                })
                created = { ...created, timeline }
            },
            /*
               Refreshes. A task created at a chosen order pushes every task from
               that position down, and those new numbers are the server's to
               assign — the same reason a reorder refreshes. The parent still
               splices the returned task in, so the list is right either way; the
               re-read is what keeps the *orders* right.
            */
        )
        // false keeps the popover open, so a rejected create does not close over
        // the fields the user filled in. See ArcPopover.onSubmit.
        if (!succeeded || !created) return false

        onCreated?.(created)

        setTitle('')
        setIsCompleted(false)
        setSelectedOrder(tasksCount)
        setTimelineDraft(null)
        return true
    }

    return (
        <>
            <ArcPopover
                triggerLabel="+ New task"
                submitLabel="Create"
                /*
                   Distinct from the task rows it sits under, in colour rather
                   than weight: those rows are the card's content and this is the
                   one action among them, so it takes the accent the rest of the
                   app uses for a primary action. Shorter, too — "Create New Task"
                   in a column of task titles read as another task.
                */
                triggerSx={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    color: 'arc.accentOnGlass',
                    fontWeight: 700,
                    '&:hover': { backgroundColor: 'arc.glassHover' },
                }}
                onSubmit={handleSubmit}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
            >
                {/*
                    Was a flat `width: 560`, which could not hold a 460px timeline
                    panel and the task fields side by side. It now asks for a
                    comfortable width and accepts less on a small screen, and the
                    row below wraps rather than overflowing.
                */}
                <Box sx={{ width: 'min(46rem, 90vw)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Title"
                        variant="filled"
                        helperText="Task Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        fullWidth
                    />

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'stretch', minHeight: TASK_PANEL_ROW_MIN_HEIGHT }}>
                        <Box sx={{ flex: '1 1 13rem', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* IsCompleted selector — mirrors bool.TrueString / FalseString options */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isCompleted}
                                        onChange={e => setIsCompleted(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">Completed</Typography>}
                            />

                            {/* Order selector */}
                            <ArcExpandingSelector
                                options={orderOptions}
                                onSelect={v => setSelectedOrder(parseInt(v, 10))}
                                placeholder="Select order"
                            />

                            {/* Task type selector */}
                            <ArcExpandingSelector
                                options={taskTypes.map(t => t.title ?? '')}
                                onSelect={handleSetTaskType}
                                placeholder="Select task type"
                            />

                            {/* The same quiet link the update popover has — this
                                is the second copy of it, and they should not
                                disagree about how prominent creating a task type
                                is. */}
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => setCreateTaskTypeOpen(true)}
                                sx={{
                                    alignSelf: 'flex-start',
                                    px: 0.5,
                                    fontSize: '0.65rem',
                                    textTransform: 'none',
                                    color: 'arc.onGlassMuted',
                                    '&:hover': { color: 'arc.onGlass', backgroundColor: 'arc.glassHover' },
                                }}
                            >
                                + New task type
                            </Button>
                        </Box>

                        <Box sx={{ flex: '1 1 18rem', minWidth: 0, display: 'flex' }}>
                            <UpdateTimelinePanel
                                timeline={null}
                                onDraftChange={setTimelineDraft}
                            />
                        </Box>
                    </Box>
                </Box>
            </ArcPopover>

            <CreateTaskTypeOverlay
                open={createTaskTypeOpen}
                onClose={() => setCreateTaskTypeOpen(false)}
                onCreated={created => {
                    // Add and select it directly. Refetching left the list correct
                    // but nothing chosen, so the type you had just created still
                    // had to be found and picked by hand.
                    setTaskTypes(existing =>
                        existing.some(taskType => taskType.id === created.id)
                            ? existing
                            : [...existing, created])
                    setSelectedTaskTypeId(created.id)
                }}
            />
        </>
    )
}

export default CreateTaskOverlay