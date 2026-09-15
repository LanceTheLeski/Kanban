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
import { rem } from '../../../Styles/Measures'
import type { Timeline } from '../../../Entities/Timeline/Timeline.Types'

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

    // ── Mode selector ─────────────────────────────────────────────────────────
    /*
       A segmented row above the panel, where this was a vertical stack of three
       buttons beside it. The stack was always shorter than the panel it sat
       next to, so it left a hole under itself in the card overlay — and it spent
       a column of width on three short words that read perfectly well in a row.
       Above also puts the control before the thing it controls, in reading order.
    */
    const MODES: { value: TimelineMode; label: string; colour: string }[] = [
        { value: 'deadline', label: 'Deadline', colour: 'arc.deadlineMode' },
        { value: 'timeline', label: 'Timeline', colour: 'arc.timelineMode' },
        { value: 'timeless', label: 'Timeless', colour: 'arc.timelessMode' },
    ]

    const modeButtons = (
        <Box
            role="group"
            aria-label="Timeline mode"
            sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}
        >
            {MODES.map(option => {
                const selected = mode === option.value
                return (
                    <Button
                        key={option.value}
                        size="small"
                        aria-pressed={selected}
                        variant={selected ? 'contained' : 'outlined'}
                        onClick={() => handleModeChange(option.value)}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            color: 'black',
                            backgroundColor: selected ? option.colour : 'transparent',
                            borderColor: option.colour,
                            // The unselected buttons sit on glass, where black on
                            // translucent is unreadable; they carry their own
                            // colour as an outline and a faint wash instead.
                            ...(selected ? {} : { color: 'arc.onGlass', opacity: 0.85 }),
                            '&:hover': {
                                backgroundColor: selected ? option.colour : 'arc.glassHover',
                                borderColor: option.colour,
                            },
                        }}
                    >
                        {option.label}
                    </Button>
                )
            })}
        </Box>
    )

/**
 * The shared geometry of the three mode panels.
 *
 * A panel takes the width it is given: `width: 100%` with `minWidth: 0` lets it
 * shrink below the intrinsic width of the date pickers inside, which are already
 * set to wrap, and the ceiling keeps it from sprawling when the container is
 * generous. Height stays a minimum so a panel grows with its own controls.
 *
 * See TIMELINE_PANEL_MAX_WIDTH in Styles/Measures for what these replaced.
 */
const PANEL = {
    p: 1,
    width: '100%',
    minWidth: 0,
    // Fills the height its container gives it, so the panel beside it in the card
    // overlay does not end up taller. The width cap TIMELINE_PANEL_MAX_WIDTH used
    // to impose is gone: both call sites now bound the panel themselves — a grid
    // track in the card overlay, the popover's own width in the task popover — so
    // a second cap only stopped it filling either.
    flex: 1,
    minHeight: rem(120),
} as const

    // ── Timeline mode (aquamarine) ───────────────────────────────────────────────
    const timelineContent = (
        <Paper sx={{ ...PANEL, backgroundColor: 'arc.timelineMode' }}>
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
        <Paper sx={{ ...PANEL, backgroundColor: 'arc.deadlineMode', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
    /*
       Centred and width-limited, because this panel stretches to match the card
       log beside it and its content is two lines. Left to fill, those two lines
       sat in the top-left of a 400px block of solid red, which reads as an error
       rather than as a choice the user made.
    */
    const timelessContent = (
        <Paper
            sx={{
                ...PANEL,
                p: 2,
                backgroundColor: 'arc.timelessMode',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
            }}
        >
            <Typography variant="body2" sx={{ color: 'white', maxWidth: '32ch' }}>
                No deadline or timeline set for this. It will not show up in most places.
            </Typography>
        </Paper>
    )

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                minWidth: 0,
                minHeight: 0,
                height: '100%',
            }}
        >
            {modeButtons}
            {mode === 'timeline' && timelineContent}
            {mode === 'deadline' && deadlineContent}
            {mode === 'timeless' && timelessContent}
        </Box>
    )
}

export default UpdateTimelinePanel