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

import React, { useContext, useEffect, useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { TextField } from '@mui/material'
import { paperField, paperFieldSx } from '../../../Styles/Paper'
import { ArcPopover } from '../../../Components/ArcPopover'
import { TASK_PANEL_ROW_MIN_HEIGHT, TASK_POPOVER_WIDTH, TASK_TITLE_ROW_MIN_HEIGHT } from '../../../Styles/Measures'
import { TagsPanel } from '../../TagGroup/Tag/TagsPanel'
import { saveTags } from '../../TagGroup/Tag/Tag.APIs'
import type { Tag } from '../../../Entities/Tag/Tag.Types'
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
import { DefaultTaskTypeContext } from './Task.Defaults'

interface CreateTaskOverlayProps
{
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
}) =>
{
    const [title, setTitle] = useState('')
    const [isCompleted, setIsCompleted] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(tasksCount)
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
    // The day's default, when the card was opened from a calendar day — see Task.Defaults.
    const defaultTaskTypeId = useContext(DefaultTaskTypeContext)
    const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<number | null>(defaultTaskTypeId)
    const [timelineDraft, setTimelineDraft] = useState<TimelineDraft | null>(null)
    const [tags, setTags] = useState<Tag[]>([])

    const [createTaskTypeOpen, setCreateTaskTypeOpen] = useState(false)

    const { run } = useBoardActions()
    const { addError } = useArcError()

    // Mirrors Blazor's OnAfterRenderAsync(firstRender)
    useEffect(() =>
    {
        fetchTaskTypes([0])
            .then(setTaskTypes)
            .catch(error => console.error('Could not load task types', error))
    }, [])

    // Order range 1..N — mirrors Blazor's _taskOrderRange initialization
    const orderOptions = Array.from({ length: tasksCount }, (_, i) => String(i + 1))

    const handleSetTaskType = (typeName: string) =>
    {
        const matches = taskTypes.filter(taskType => taskType.title === typeName)
        if (matches.length !== 1)
        {
            console.error(`Task type "${typeName}" not uniquely found`)
            return
        }
        setSelectedTaskTypeId(matches[0].id)
    }

    const handleSubmit = async () =>
    {
        // -1 used to go out here when nothing was selected, and the API answered
        // "The TaskTypeID passed in does not exist in the service" — technically
        // true, and useless. Ask for the missing field instead of inventing one.
        if (selectedTaskTypeId === null)
        {
            addError('Pick a task type before adding the task.')
            // false, so the popover stays open on the field that is missing.
            // Returning nothing closed it — telling the user what was wrong and
            // then throwing away everything they had typed to fix it.
            return false
        }

        let created: Task | null = null

        const succeeded = await run(
            'Adding task',
            async () =>
            {
                created = await createTask(boardId, cardId, {
                    title: title.trim() || 'New Task',
                    taskTypeId: selectedTaskTypeId,
                    order: selectedOrder,
                    isComplete: isCompleted,
                })

                // Tags, like the timeline below, go on once the task has an ID.
                if (tags.length > 0)
                    created = { ...created, tags: await saveTags({ id: created.id, kind: 'task' }, [], tags) }

                // The create endpoint takes no timeline, so a task that was given
                // dates needs a follow-up POST parented to the new task —
                // mirrors CreateTimelineAsync() in the Blazor overlay.
                if (!hasTimeline(timelineDraft))
                    return

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
        if (!succeeded || !created)
            return false

        onCreated?.(created)

        setTitle('')
        setIsCompleted(false)
        setSelectedOrder(tasksCount)
        setTimelineDraft(null)
        setTags([])
        return true
    }

    return (
        <>
            <ArcPopover triggerLabel="+ New task"
                        submitLabel="Create"
                        /*
                           Distinct from the task rows it sits under, in colour rather
                           than weight: those rows are the card's content and this is the
                           one action among them, so it takes the accent the rest of the
                           app uses for a primary action. Shorter, too — "Create New Task"
                           in a column of task titles read as another task.
                        */
                        /*
                           A piece of neutral card, like everything else in the
                           tray. It used to be accent-coloured text standing
                           directly on the tray floor — one of two controls in
                           the card overlay with nothing under them.
                        */
                        triggerClassName="card-stock"
                        triggerSx={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            color: 'arc.onPaperStrong',
                            fontWeight: 700,
                            px: 1,
                            '&:hover': { backgroundColor: 'transparent' },
                                  }}
                        /* Card now, like the rows above it, so its open marker darkens. */
                        triggerOpenSx={{ backgroundColor: 'arc.paperSelected',
                                         color: 'arc.onPaperStrong'
                                      }}
                        title="New task"
                        titleStock="green"
                        onSubmit={handleSubmit}
                        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'center', horizontal: 'left' }}>
                {/*
                    Laid out as the task popover is: the title and its tags, the
                    fields in a row, and the timeline across the whole width
                    under them — see UpdateTaskPopover for why it is not beside
                    them any more.
                */}
                <Box sx={{ width: TASK_POPOVER_WIDTH,
                           maxWidth: '90vw',
                           display: 'flex',
                           flexDirection: 'column',
                           gap: 1.5
                        }}>
                    <Box sx={{ display: 'flex',
                               gap: 1,
                               alignItems: 'stretch',
                               minHeight: TASK_TITLE_ROW_MIN_HEIGHT
                            }}>
                        <TextField {...paperField('green')}
                                   placeholder="Task title"
                                   value={title}
                                   onChange={e => setTitle(e.target.value)}
                                   multiline
                                   minRows={2}
                                   maxRows={3}
                                   sx={{ ...paperFieldSx, flex: 1, minWidth: 0 }} />

                        <TagsPanel tags={tags}
                                   onChange={setTags}
                                   label="Task tags" />
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                        {/* IsCompleted selector — mirrors bool.TrueString / FalseString options */}
                        <FormControlLabel className="card-stock"
                                          sx={{ m: 0,
                                                pr: 1.25,
                                                '& .MuiCheckbox-root': { color: 'arc.onPaperMuted' },
                                                '& .Mui-checked': { color: 'arc.paperAccent' }
                                             }}
                                          control={
                                              <Checkbox checked={isCompleted}
                                                        onChange={e => setIsCompleted(e.target.checked)}
                                                        size="small" />
                                          }
                                          label={<Typography variant="body2"
                                                             sx={{ color: 'arc.onPaperStrong',
                                                                   fontWeight: 600
                                                                }}>
                                                     Completed
                                                 </Typography>} />

                        {/* Order selector */}
                        <Box sx={{ flex: '1 1 8rem', minWidth: 0 }}>
                            <ArcExpandingSelector options={orderOptions}
                                                  onSelect={v => setSelectedOrder(parseInt(v, 10))}
                                                  placeholder="Select order" />
                        </Box>

                        {/* Task type selector */}
                        <Box sx={{ flex: '1 1 10rem', minWidth: 0 }}>
                            <ArcExpandingSelector options={taskTypes.map(t => t.title ?? '')}
                                                  onSelect={handleSetTaskType}
                                                  placeholder={taskTypes.find(taskType => taskType.id === selectedTaskTypeId)?.title ?? 'Select task type'} />
                        </Box>

                        {/* The same quiet card the update popover has — they
                            should not disagree about how prominent creating a
                            task type is. */}
                        <Button size="small"
                                variant="text"
                                className="card-stock"
                                onClick={() => setCreateTaskTypeOpen(true)}
                                sx={{ alignSelf: 'center',
                                      px: 1,
                                      fontSize: '0.65rem',
                                      textTransform: 'none',
                                      color: 'arc.onPaperMuted',
                                      '&:hover': { color: 'arc.onPaperStrong', backgroundColor: 'transparent' }
                                   }}>
                            + New task type
                        </Button>
                    </Box>

                    <Box sx={{ display: 'grid', minHeight: TASK_PANEL_ROW_MIN_HEIGHT }}>
                        <UpdateTimelinePanel timeline={null}
                                             onDraftChange={setTimelineDraft}
                                             boardId={boardId}
                                             subjectTitle={title || 'New task'} />
                    </Box>
                </Box>
            </ArcPopover>

            <CreateTaskTypeOverlay open={createTaskTypeOpen}
                                   onClose={() => setCreateTaskTypeOpen(false)}
                                   onCreated={created =>
                                   {
                                       // Add and select it directly. Refetching left the list correct
                                       // but nothing chosen, so the type you had just created still
                                       // had to be found and picked by hand.
                                       setTaskTypes(existing =>
                                           existing.some(taskType => taskType.id === created.id)
                                               ? existing
                                               : [...existing, created])
                                       setSelectedTaskTypeId(created.id)
                                   }} />
        </>
    )
}

export default CreateTaskOverlay