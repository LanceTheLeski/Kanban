/**
 * UpdateTaskPopover
 *
 * Mirrors: Task/UpdateTaskPopover.razor + UpdateTaskPopover.cs
 *
 * ── Ref elimination ───────────────────────────────────────────────────────────
 * The Blazor .cs accessed UpdateTimelinePanel's public fields directly via @ref:
 *   updateTimelinePanel._dateRangePreferred.Start, _timePreferredStart, etc.
 * We invert this: UpdateTimelinePanel calls onDraftChange() with a TimelineDraft
 * whenever any picker changes. This component stores that draft and uses it in
 * UpdateTaskAsync. No ref needed.
 *
 * ── Initial state tracking ────────────────────────────────────────────────────
 * The Blazor version stored _initialTaskTitle, _initialTaskTypeId, _initialTaskOrder,
 * _initialTimeline, _initialIsCompleted to diff against on submit, building a
 * JSON Patch document. We preserve this pattern with the same field names.
 *
 * ── Patch document ────────────────────────────────────────────────────────────
 * The Blazor code used Microsoft.AspNetCore.JsonPatch.JsonPatchDocument.
 * We represent the same concept as a plain object — the API stub accepts `object`.
 * When real HTTP is wired in, serialize this as a JSON Patch array.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material'
import { ArcPopover } from '../../../Components/ArcPopover'
import { ArcExpandingSelector } from '../../../Components/ArcExpandingSelector'
import { UpdateTimelinePanel } from '../Timeline/UpdateTimelinePanel'
import { CreateTaskTypeOverlay } from '../../TagGroup/TaskType/CreateTaskTypeOverlay'
import { useBoardActions } from '../useBoardActions'
import { createTimeline, fetchTaskTypes, updateTask, updateTimeline, type TaskPatch } from '../Board.APIs'
import {
    draftToTimelineDates,
    hasTimeline,
    timelineOperations,
    TIMELINE_PARENT_TASK,
    type TimelineDraft,
} from '../Timeline/Timeline.Draft'
import { TASK_PANEL_ROW_MIN_HEIGHT, TASK_POPOVER_WIDTH } from '../../../Styles/Measures'
import type { Task, TaskType } from '../../../Entities/Task/Task.Types'
import type { Timeline } from '../../../Entities/Timeline/Timeline.Types'

interface UpdateTaskPopoverProps {
    task: Task
    /** Called after task is updated so UpdateCardOverlay can reflect changes */
    onUpdated?: (updated: Task) => void
    boardId: string
    cardId: string
    tasksCount: number
    /** Mirrors PopoverBaseMudSize / PopoverBaseMudStyle / PopoverBaseMudTextStyle */
    triggerSize?: 'small' | 'medium' | 'large'
    triggerSx?: import('@mui/material').SxProps<import('@mui/material').Theme>
}

export const UpdateTaskPopover: React.FC<UpdateTaskPopoverProps> = ({
    task,
    onUpdated,
    boardId,
    cardId,
    tasksCount,
    triggerSize = 'medium',
    triggerSx,
}) => {
    // ── Local state (mirrors Blazor's mutable ActiveTask fields) ─────────────────
    const [title, setTitle] = useState(task.title)
    const [isCompleted, setIsCompleted] = useState(task.isCompleted ?? false)
    const [order, setOrder] = useState(task.order)
    const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<number>(task.taskType?.id ?? -1)

    // ── Initial values for diffing (mirrors Blazor's _initial* fields) ───────────
    const initialTitle = useRef(task.title)
    const initialTypeId = useRef(task.taskType?.id ?? -1)
    const initialOrder = useRef(task.order)
    const initialTimeline = useRef<Timeline | null>(task.timeline)
    const initialIsCompleted = useRef(task.isCompleted)

    const [timelineDraft, setTimelineDraft] = useState<TimelineDraft | null>(null)
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
    const [createTaskTypeOpen, setCreateTaskTypeOpen] = useState(false)

    // Order range 1..N — mirrors Blazor's _taskOrderRange
    const orderOptions = Array.from({ length: tasksCount }, (_, i) => String(i + 1))

    const { run } = useBoardActions()

    // Mirrors Blazor's OnAfterRenderAsync(firstRender)
    useEffect(() => {
        fetchTaskTypes([0])
            .then(setTaskTypes)
            .catch(error => console.error('Could not load task types', error))
    }, [])

    const handleSetTaskType = (typeName: string) => {
        const matches = taskTypes.filter(taskType => taskType.title === typeName)
        if (matches.length !== 1) return
        setSelectedTaskTypeId(matches[0].id)
    }

    const handleSubmit = async () => {
        // Build patch — only include fields that actually changed
        // Mirrors Blazor's patchDocument.Add() conditional checks
        const patch: TaskPatch = {}

        if (title !== initialTitle.current) patch.title = title
        if (selectedTaskTypeId !== initialTypeId.current) patch.typeID = selectedTaskTypeId
        if (order !== initialOrder.current) patch.order = order
        if (isCompleted !== initialIsCompleted.current) patch.isComplete = isCompleted

        const existingTimeline = initialTimeline.current
        const timelineChanged = hasTimeline(timelineDraft)
        const orderChanged = patch.order !== undefined

        if (Object.keys(patch).length === 0 && !timelineChanged) return true

        let savedTimeline: Timeline | null = existingTimeline

        const saved = await run(
            'Saving task',
            async () => {
                if (Object.keys(patch).length > 0)
                    await updateTask(boardId, cardId, task.id, patch)

                // Timeline handling mirrors Blazor's create-vs-update branch:
                //   - task has no existing timeline + mode != timeless → create
                //   - task already has one → patch it in place
                if (!timelineChanged) return

                const dates = draftToTimelineDates(timelineDraft)

                if (existingTimeline?.id) {
                    await updateTimeline(boardId, existingTimeline.id, timelineOperations(dates))
                    savedTimeline = { ...existingTimeline, ...dates }
                } else {
                    savedTimeline = await createTimeline(boardId, {
                        parentId: task.id,
                        // The parent kind, not the mode — see timelineDraft.
                    timelineTypeId: TIMELINE_PARENT_TASK,
                        ...dates,
                    })
                }
            },
            /*
               An order change is the one task edit the client cannot predict the
               result of: the server renumbers every sibling around the moved
               task, and nothing here knows what those new numbers are. Left
               unrefreshed, `initialOrder` and the sibling orders drift out of
               step with the rows, and the next reorder is computed against
               numbers that no longer exist — which is how a second move ends up
               asking the server to shuffle a task into a slot nothing occupies.

               Every other field is local to this task, so it still skips the
               round trip and the parent splices the result in from onUpdated.
            */
            { refresh: orderChanged }
        )
        if (!saved) return false

        initialTitle.current = title
        initialTypeId.current = selectedTaskTypeId
        initialOrder.current = order
        initialIsCompleted.current = isCompleted
        initialTimeline.current = savedTimeline

        /*
           An order change has already been answered by the refresh inside run(),
           which replaced every task on the card with the server's renumbering.
           Reporting the change upward as well would write this component's idea
           of the list back over that — and this component's idea is the one from
           before the save, captured when the handler was created.

           That is why reordering appeared to do nothing: the refresh fetched the
           right order and the callback immediately overwrote it with the old one.
        */
        if (!orderChanged)
            onUpdated?.({
                ...task,
                title,
                order,
                isCompleted,
                timeline: savedTimeline,
                taskType: taskTypes.find(taskType => taskType.id === selectedTaskTypeId)
                    ?? task.taskType,
            })

        return true
    }

    /**
     * Puts the draft back to what is saved.
     *
     * Called whenever the popover closes, which covers Discard, Escape and a
     * click outside. After a successful submit the refs below have already been
     * moved to the new values, so this is a no-op there; after a failed one the
     * popover stays open and this does not run at all.
     */
    const revertDraft = () => {
        setTitle(initialTitle.current)
        setIsCompleted(initialIsCompleted.current ?? false)
        setOrder(initialOrder.current)
        setSelectedTaskTypeId(initialTypeId.current)
        setTimelineDraft(null)
    }

    return (
        <>
            <ArcPopover triggerLabel={task.title}
                        onSubmit={handleSubmit}
                        triggerSize={triggerSize}
                        onClose={revertDraft}
                        triggerSx={{
                            /*
                               No default ground. This used to open with
                               `backgroundColor: 'arc.taskPanel'` — a translucent
                               blue — which the only caller then overrode with
                               `transparent`, so it never painted. Now that the
                               row it sits on is a piece of card, a blue default
                               would not just be dead, it would be wrong.
                            */
                            ...(triggerSx as object),
                            /*
                               Struck through from the *draft*, so ticking Completed
                               shows on the card immediately rather than only after a
                               save. Closing without saving runs revertDraft above, which
                               puts the line back.

                               It lives here rather than in the list because this is where
                               the unsaved value is; the list only knows what is stored.
                            */
                            ...(isCompleted
                                ? {
                                    // onPaper, because the row this sits on is a
                                    // piece of card. It was onGlassMuted — a 60%
                                    // white, which on card stock struck the title
                                    // through and then made it invisible.
                                    color: 'arc.onPaperMuted',
                                    '&&': { textDecoration: 'line-through' },
                                }
                                : {}),
                        }}
                        /*
                           The task rows are card stock, so an open row darkens
                           rather than lightening, and keeps its dark label.
                        */
                        triggerOpenSx={{ backgroundColor: 'arc.paperSelected',
                                         color: 'arc.onPaperStrong' }}
                        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'center', horizontal: 'left' }}>
                <Box sx={{ width: TASK_POPOVER_WIDTH, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Title"
                               variant="filled"
                               helperText="Task Title"
                               value={title}
                               onChange={e => setTitle(e.target.value)}
                               fullWidth />

                    {/*
                        A floor on the row, and explicit bases for its two halves.

                        The three timeline modes are different heights, so without
                        a floor the popover grew and shrank as you switched between
                        them — and with both halves on a bare `flex: 1` the panel
                        and the selectors fought over the width, which is what
                        squashed the dropdowns.
                    */}
                    <Box sx={{ display: 'flex',
                               gap: 2,
                               alignItems: 'stretch',
                               minHeight: TASK_PANEL_ROW_MIN_HEIGHT }}>
                        <Box sx={{ flex: '1 1 13rem',
                                   minWidth: 0,
                                   display: 'flex',
                                   flexDirection: 'column',
                                   gap: 1 }}>
                            <FormControlLabel control={
                                                  <Checkbox checked={isCompleted}
                                                            onChange={e => setIsCompleted(e.target.checked)}
                                                            size="small" />
                                              }
                                              label={<Typography variant="body2">Completed</Typography>} />

                            <ArcExpandingSelector options={orderOptions}
                                                  onSelect={v => setOrder(parseInt(v, 10) - 1)}
                                                  placeholder={`Order: ${order + 1}`} />

                            <ArcExpandingSelector options={taskTypes.map(t => t.title ?? '')}
                                                  onSelect={handleSetTaskType}
                                                  placeholder={task.taskType?.title ?? 'Select task type'} />

                            {/*
                                A text link, not an outlined button. Creating a
                                task *type* is a rare, secondary act — it was
                                competing with the two selectors above it for
                                attention while being the least likely thing
                                anyone opened this popover to do.
                            */}
                            <Button size="small"
                                    variant="text"
                                    onClick={() => setCreateTaskTypeOpen(true)}
                                    sx={{ alignSelf: 'flex-start',
                                          px: 0.5,
                                          fontSize: '0.65rem',
                                          textTransform: 'none',
                                          color: 'arc.onGlassMuted',
                                          '&:hover': { color: 'arc.onGlass', backgroundColor: 'arc.glassHover' } }}>
                                + New task type
                            </Button>
                        </Box>

                        <Box sx={{ flex: '1 1 18rem', minWidth: 0, display: 'flex' }}>
                            <UpdateTimelinePanel timeline={task.timeline}
                                                 onDraftChange={setTimelineDraft} />
                        </Box>
                    </Box>
                </Box>
            </ArcPopover>

            <CreateTaskTypeOverlay open={createTaskTypeOpen}
                                   onClose={() => setCreateTaskTypeOpen(false)}
                                   onCreated={() => fetchTaskTypes([0]).then(setTaskTypes)} />
        </>
    )
}

export default UpdateTaskPopover