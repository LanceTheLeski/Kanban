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
import { fetchTaskTypes, updateTask } from '../../../APIs/Board.APIs'
import type { Task, TaskTypeResponse, Timeline } from '../../../Types/Board.Types'

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
    const [taskTypes, setTaskTypes] = useState<TaskTypeResponse[]>([])
    const [createTaskTypeOpen, setCreateTaskTypeOpen] = useState(false)

    // Order range 1..N — mirrors Blazor's _taskOrderRange
    const orderOptions = Array.from({ length: tasksCount }, (_, i) => String(i + 1))

    // Mirrors Blazor's OnAfterRenderAsync(firstRender)
    useEffect(() => {
        fetchTaskTypes([0]).then(setTaskTypes)
    }, [])

    const handleSetTaskType = (typeName: string) => {
        const matches = taskTypes.filter(t => t.title === typeName)
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

        // Timeline handling mirrors Blazor's create-vs-update branch:
        //   - task has no existing timeline + mode != timeless → create
        //   - task has existing timeline → update
        // TODO: wire up createTimeline / updateTimeline API calls using timelineDraft

        if (Object.keys(patch).length > 0 || timelineDraft) {
            await updateTask(boardId, cardId, task.id!, patch)
        }

        onUpdated?.({
            ...task,
            title,
            order,
            isCompleted,
            taskType: task.taskType
                ? { ...task.taskType, id: selectedTaskTypeId }
                : null,
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