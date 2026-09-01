/**
 * UpdateTimelinePanel
 *
 * Mirrors: Timeline/UpdateTimelinePanel.razor + UpdateTimelinePanel.cs
 *
 * The Blazor version had three display modes driven by a bool? (null = Timeless):
 *   - true  → Timeline mode (aquamarine): full preferred + required date ranges + times
 *   - false → Deadline mode (goldenrod): single end date + time only
 *   - null  → Timeless mode (red): no dates, warning message
 *
 * In Blazor these were RenderFragments built in .cs method factories and stored
 * as fields. In React we just switch on a state enum — much simpler.
 *
 * ── DateRangePicker note ─────────────────────────────────────────────────────
 * MudDateRangePicker → @mui/x-date-pickers DateRangePicker requires the MUI X Pro
 * license. We use two separate DatePicker components (Start + End) instead.
 * This is functionally equivalent and avoids a commercial dependency.
 *
 * ── Date adapter ─────────────────────────────────────────────────────────────
 * @mui/x-date-pickers requires a date adapter. We use dayjs (lightweight).
 * The LocalizationProvider wrapping this component must be set up in App.tsx:
 *   <LocalizationProvider dateAdapter={AdapterDayjs}>
 *
 * ── Ref exposure ─────────────────────────────────────────────────────────────
 * In Blazor, UpdateTaskPopover.cs held a direct @ref="updateTimelinePanel" and
 * accessed its public fields (_dateRangePreferred, _timePreferredStart, etc.)
 * to build the timeline create/update request.
 *
 * In React we invert this: UpdateTimelinePanel calls onDateChange() whenever
 * any picker changes, passing up a structured TimelineDraft object. The parent
 * (UpdateTaskPopover) receives it via callback and stores it locally. This is
 * the React way to avoid ref-based field access between sibling-ish components.
 */

import React, { useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import type { Dayjs } from 'dayjs'
import type { Timeline } from '../../../Types/Board.Types'

// ── Types ─────────────────────────────────────────────────────────────────────

type TimelineMode = 'timeline' | 'deadline' | 'timeless'

/**
 * Structured output sent to the parent on every change.
 * Replaces the parent's @ref-based field access from the Blazor version.
 */
export interface TimelineDraft {
    mode: TimelineMode
    preferredStart: Date | null
    preferredEnd: Date | null
    requiredStart: Date | null
    requiredEnd: Date | null
    preferredStartTime: string | null // HH:MM
    preferredEndTime: string | null
    requiredStartTime: string | null
    requiredEndTime: string | null
}

interface UpdateTimelinePanelProps {
    /** Existing timeline data to pre-fill pickers — mirrors @bind-Timeline */
    timeline: Timeline | null
    /** Called whenever any picker value changes */
    onDraftChange?: (draft: TimelineDraft) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const toDate = (d: Dayjs | null): Date | null => d?.toDate() ?? null
const toTimeStr = (d: Dayjs | null): string | null =>
    d ? d.format('HH:mm') : null

// ── Component ─────────────────────────────────────────────────────────────────

export const UpdateTimelinePanel: React.FC<UpdateTimelinePanelProps> = ({
    timeline,
    onDraftChange,
}) => {
    // Determine initial mode from existing timeline data
    // Mirrors Blazor's OnInitialized() isTimeless / isDeadline() logic
    const getInitialMode = (): TimelineMode => {
        if (!timeline) return 'timeless'
        const hasPreferred = timeline.startPreferenceUTC || timeline.endPreferenceUTC
        return hasPreferred ? 'timeline' : 'deadline'
    }

    const [mode, setMode] = useState<TimelineMode>(getInitialMode)

    // Preferred range (Timeline mode only)
    const [prefStart, setPrefStart] = useState<Dayjs | null>(null)
    const [prefEnd, setPrefEnd] = useState<Dayjs | null>(null)
    const [prefStartTime, setPrefStartTime] = useState<Dayjs | null>(null)
    const [prefEndTime, setPrefEndTime] = useState<Dayjs | null>(null)

    // Required/deadline range
    const [reqStart, setReqStart] = useState<Dayjs | null>(null)
    const [reqEnd, setReqEnd] = useState<Dayjs | null>(null)
    const [reqStartTime, setReqStartTime] = useState<Dayjs | null>(null)
    const [reqEndTime, setReqEndTime] = useState<Dayjs | null>(null)

    const emitChange = (overrides?: Partial<{
        ps: Dayjs | null; pe: Dayjs | null; pst: Dayjs | null; pet: Dayjs | null
        rs: Dayjs | null; re: Dayjs | null; rst: Dayjs | null; ret: Dayjs | null
        m: TimelineMode
    }>) => {
        onDraftChange?.({
            mode: overrides?.m ?? mode,
            preferredStart: toDate(overrides?.ps ?? prefStart),
            preferredEnd: toDate(overrides?.pe ?? prefEnd),
            preferredStartTime: toTimeStr(overrides?.pst ?? prefStartTime),
            preferredEndTime: toTimeStr(overrides?.pet ?? prefEndTime),
            requiredStart: toDate(overrides?.rs ?? reqStart),
            requiredEnd: toDate(overrides?.re ?? reqEnd),
            requiredStartTime: toTimeStr(overrides?.rst ?? reqStartTime),
            requiredEndTime: toTimeStr(overrides?.ret ?? reqEndTime),
        })
    }

    const handleModeChange = (newMode: TimelineMode) => {
        setMode(newMode)
        emitChange({ m: newMode })
    }

    // ── Mode selector buttons (mirrors Blazor's three-button Stack) ─────────────
    const modeButtons = (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mr: 1 }}>
            <Button
                size="small"
                variant={mode === 'deadline' ? 'contained' : 'outlined'}
                onClick={() => handleModeChange('deadline')}
                sx={{ backgroundColor: mode === 'deadline' ? 'lightgoldenrodyellow' : undefined, color: 'black' }}
            >
                Deadline
            </Button>
            <Button
                size="small"
                variant={mode === 'timeline' ? 'contained' : 'outlined'}
                onClick={() => handleModeChange('timeline')}
                sx={{ backgroundColor: mode === 'timeline' ? 'aquamarine' : undefined, color: 'black' }}
            >
                Timeline
            </Button>
            <Button
                size="small"
                variant={mode === 'timeless' ? 'contained' : 'outlined'}
                onClick={() => handleModeChange('timeless')}
                sx={{ backgroundColor: mode === 'timeless' ? 'indianred' : undefined, color: 'black' }}
            >
                Timeless
            </Button>
        </Box>
    )

    // ── Timeline mode (aquamarine) ───────────────────────────────────────────────
    const timelineContent = (
        <Paper sx={{ p: 1, backgroundColor: 'aquamarine', width: 460, minHeight: 120 }}>
            {/* Preferred row */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <DatePicker
                    label="Preferred Start"
                    value={prefStart}
                    onChange={v => { setPrefStart(v); emitChange({ ps: v }) }}
                    slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                    label="Preferred End"
                    value={prefEnd}
                    onChange={v => { setPrefEnd(v); emitChange({ pe: v }) }}
                    slotProps={{ textField: { size: 'small' } }}
                />
                <TimePicker
                    label="Preferred Start Time"
                    value={prefStartTime}
                    onChange={v => { setPrefStartTime(v); emitChange({ pst: v }) }}
                    slotProps={{ textField: { size: 'small' } }}
                />
                <TimePicker
                    label="Preferred End Time"
                    value={prefEndTime}
                    onChange={v => { setPrefEndTime(v); emitChange({ pet: v }) }}
                    slotProps={{ textField: { size: 'small' } }}
                />
            </Box>
            {/* Required/deadline row */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <DatePicker
                    label="Required Start"
                    value={reqStart}
                    onChange={v => { setReqStart(v); emitChange({ rs: v }) }}
                    slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                    label="Required End"
                    value={reqEnd}
                    onChange={v => { setReqEnd(v); emitChange({ re: v }) }}
                    slotProps={{ textField: { size: 'small' } }}
                />
                <TimePicker
                    label="Required Start Time"
                    value={reqStartTime}
                    onChange={v => { setReqStartTime(v); emitChange({ rst: v }) }}
                    slotProps={{ textField: { size: 'small' } }}
                />
                <TimePicker
                    label="Required End Time"
                    value={reqEndTime}
                    onChange={v => { setReqEndTime(v); emitChange({ ret: v }) }}
                    slotProps={{ textField: { size: 'small' } }}
                />
            </Box>
        </Paper>
    )

    // ── Deadline mode (goldenrod) ────────────────────────────────────────────────
    const deadlineContent = (
        <Paper sx={{ p: 1, backgroundColor: 'lightgoldenrodyellow', width: 460, minHeight: 120, display: 'flex', gap: 1 }}>
            <DatePicker
                label="End Date"
                value={reqEnd}
                onChange={v => { setReqEnd(v); emitChange({ re: v }) }}
                slotProps={{ textField: { size: 'small' } }}
            />
            <TimePicker
                label="Required End Time"
                value={reqEndTime}
                onChange={v => { setReqEndTime(v); emitChange({ ret: v }) }}
                slotProps={{ textField: { size: 'small' } }}
            />
        </Paper>
    )

    // ── Timeless mode (red) ──────────────────────────────────────────────────────
    const timelessContent = (
        <Paper sx={{ p: 2, backgroundColor: 'indianred', width: 460, minHeight: 120 }}>
            <Typography variant="body2" sx={{ color: 'white' }}>
                You have opted not to give a deadline/timeline for this.
                As a result, it may not show up in most places.
            </Typography>
        </Paper>
    )

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            {modeButtons}
            {mode === 'timeline' && timelineContent}
            {mode === 'deadline' && deadlineContent}
            {mode === 'timeless' && timelessContent}
        </Box>
    )
}

export default UpdateTimelinePanel