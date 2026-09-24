/**
 * Task entity, and the TaskType it is categorised by.
 *
 * Mirrors: ArcStrides.UI.Legacy/Models/Board/Task.cs and TaskType.cs
 *
 * Shared rather than board-owned: the calendar reads a card's tasks too — to
 * count them on the month grid and to list their deadlines in a day's overlay.
 *
 * A Task references Timeline. Entities are allowed to reference each other where
 * the domain genuinely contains one in the other — Card holds Tasks, a Task holds
 * a Timeline — and that containment only ever points one way, so it stays acyclic.
 */

import type { Timeline } from '../Timeline/Timeline.Types'

export interface TaskType {
    id: number
    groupTagId: string | null
    title: string
}

export interface Task {
    id: string
    title: string
    order: number
    taskType: TaskType | null
    isCompleted: boolean | null
    timeline: Timeline | null
}
