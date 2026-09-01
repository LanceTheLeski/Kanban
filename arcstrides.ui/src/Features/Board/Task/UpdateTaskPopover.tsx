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
import { UpdateTimelinePanel, type TimelineDraft } from '../Timeline/UpdateTimelinePanel'
import { CreateTaskTypeOverlay } from '../../TagGroup/TaskType/CreateTaskTypeOverlay'
import { useBoardActions } from '../useBoardActions'
import { createTimeline, fetchTaskTypes, updateTask, updateTimeline } from '../../../APIs/Board.APIs'
import {
    draftToTimelineDates,
    hasTimeline,
    timelineOperations,
    timelineTypeIdFor,
} from '../Timeline/timelineDraft'
import type { Task, TaskType, Timeline } from '../../../Types/Board.Types'

interface UpdateTaskPopoverProps {
    task: Task
    /** Called after task is updated so UpdateCardOverlay can reflect changes */
    onUpdated?: (updated: Task) => void
    boardId: string
    cardId: string
    tasksCount: number
    /** Mirrors PopoverBaseMudSize / PopoverBaseMudStyle / PopoverBaseMudTextStyle */
    triggerSize?: 'small' | 'medium' | 'large'
    triggerStyle?: React.CSSProperties
}

export const UpdateTaskPopover: React.FC<UpdateTaskPopoverProps> = ({
    task,
    onUpdated,
    boardId,
    cardId,
    tasksCount,
    triggerSize = 'medium',
    triggerStyle,
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
        const patch: Record<string, unknown> = {}

        if (title !== initialTitle.current) patch.title = title
        if (selectedTaskTypeId !== initialTypeId.current) patch.typeId = selectedTaskTypeId
        if (order !== initialOrder.current) patch.order = order
        if (isCompleted !== initialIsCompleted.current) patch.isComplete = isCompleted

        const existingTimeline = initialTimeline.current
        const timelineChanged = hasTimeline(timelineDraft)

        if (Object.keys(patch).length === 0 && !timelineChanged) return

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
                        timelineTypeId: timelineTypeIdFor(timelineDraft),
                        ...dates,
                    })
                }
            },
            // The parent updates its own task list from onUpdated below.
            { refresh: false }
        )
        if (!saved) return

        initialTitle.current = title
        initialTypeId.current = selectedTaskTypeId
        initialOrder.current = order
        initialIsCompleted.current = isCompleted
        initialTimeline.current = savedTimeline

        onUpdated?.({
            ...task,
            title,
            order,
            isCompleted,
            timeline: savedTimeline,
            taskType: taskTypes.find(taskType => taskType.id === selectedTaskTypeId)
                ?? task.taskType,
        })
    }

    return (
        <>
            <ArcPopover
                triggerLabel={task.title}
                onSubmit={handleSubmit}
                triggerSize={triggerSize}
                triggerStyle={{
                    backgroundColor: 'rgba(153, 214, 255, 0.8)',
                    ...triggerStyle,
                }}
                anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                transformOrigin={{ vertical: 'center', horizontal: 'left' }}
            >
                <Box sx={{ width: 560, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Title"
                        variant="filled"
                        helperText="Task Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        fullWidth
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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

                            <ArcExpandingSelector
                                options={orderOptions}
                                onSelect={v => setOrder(parseInt(v, 10) - 1)}
                                placeholder={`Order: ${order + 1}`}
                            />

                            <ArcExpandingSelector
                                options={taskTypes.map(t => t.title ?? '')}
                                onSelect={handleSetTaskType}
                                placeholder={task.taskType?.title ?? 'Select task type'}
                            />

                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setCreateTaskTypeOpen(true)}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Create New Task Type
                            </Button>
                        </Box>

                        <UpdateTimelinePanel
                            timeline={task.timeline}
                            onDraftChange={setTimelineDraft}
                        />
                    </Box>
                </Box>
            </ArcPopover>

            <CreateTaskTypeOverlay
                open={createTaskTypeOpen}
                onClose={() => setCreateTaskTypeOpen(false)}
                onCreated={() => fetchTaskTypes([0]).then(setTaskTypes)}
            />
        </>
    )
}

export default UpdateTaskPopover