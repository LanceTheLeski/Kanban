/**
 * UpdateTimelinePanel
 *
 * Mirrors: Timeline/UpdateTimelinePanel.razor + UpdateTimelinePanel.cs
 *
 * ── What this used to be ─────────────────────────────────────────────────────
 * Three mode panels, one shown at a time, each a block of flat colour holding up
 * to eight date and time pickers laid out as two wrapping rows. It told you
 * nothing about the shape of the schedule — which date came before which, or
 * which were even set — and it was the single biggest thing in the card overlay,
 * stretching to whatever height the panel beside it reached.
 *
 * ── What it is now ───────────────────────────────────────────────────────────
 * The four dates a card can carry are points on a line, in the order they happen:
 *
 *     ──●────────●──────────●────────●──
 *   Preferred  Required  Preferred  Required
 *     Start      Start      End        End
 *
 * A filled node has a date, a hollow one does not, and a dimmed one is not part
 * of the current mode. So the rail answers "what is scheduled here" at a glance,
 * which eight labelled pickers never did.
 *
 * Only the selected node's pickers are on screen. That is what keeps the panel
 * contained: one date and one time at a time rather than eight of both, and the
 * rail itself is about 60px tall whatever is set.
 *
 * ── Mode decides which nodes exist ───────────────────────────────────────────
 * The Blazor original drove three separate layouts off a `bool?`. The modes are
 * kept because they are a real distinction, but they now say which nodes are in
 * play rather than which panel to render:
 *
 *   Deadline  just the required end — the common case, one date
 *   Timeline  all four
 *   Timeless  none
 *
 * ── The draft contract is unchanged ──────────────────────────────────────────
 * TimelineDraft has exactly four date+time pairs, which is why it maps onto four
 * nodes without a translation step. timelineDraft.ts, CreateTaskOverlay and
 * UpdateTaskPopover all consume it and none of them needed a change.
 *
 * ── DateRangePicker note ─────────────────────────────────────────────────────
 * MudDateRangePicker → @mui/x-date-pickers DateRangePicker requires the MUI X Pro
 * licence. Separate Date and Time pickers instead, which the rail suits anyway:
 * a range picker cannot express four independent points.
 *
 * ── Ref exposure ─────────────────────────────────────────────────────────────
 * In Blazor, UpdateTaskPopover.cs held @ref="updateTimelinePanel" and read its
 * public fields. Here the panel calls onDraftChange with a structured draft, so
 * nothing reaches into it.
 */

import React, { useMemo, useState } from 'react'
import { Box, Button, ButtonBase, Paper, Tooltip, Typography } from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import dayjs, { type Dayjs } from 'dayjs'
import { rem } from '../../../Styles/Measures'
import type { Timeline } from '../../../Entities/Timeline/Timeline.Types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TimelineMode = 'timeline' | 'deadline' | 'timeless'

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
    /** Existing timeline data to pre-fill the nodes — mirrors @bind-Timeline */
    timeline: Timeline | null
    /** Called whenever any node changes */
    onDraftChange?: (draft: TimelineDraft) => void
}

// ── The four points ───────────────────────────────────────────────────────────

type NodeId = 'preferredStart' | 'requiredStart' | 'preferredEnd' | 'requiredEnd'

interface NodeSpec {
    id: NodeId
    /** Two words, stacked under the dot. */
    label: [string, string]
    /** What it means, for the node's tooltip. */
    meaning: string
    /** Which timeline field seeds it. */
    seed: (timeline: Timeline) => Date | null
}

/**
 * In the order they occur, which is also the order they are drawn. Required
 * start before preferred start reads oddly as a list and correctly as a line:
 * the hard "must not start before" sits outside the soft "would like to start".
 * The request asked for preferred first, so that is the order kept.
 */
const NODES: NodeSpec[] = [
    {
        id: 'preferredStart',
        label: ['Preferred', 'Start'],
        meaning: 'When this would ideally begin',
        seed: timeline => timeline.startPreferenceUTC,
    },
    {
        id: 'requiredStart',
        label: ['Required', 'Start'],
        meaning: 'The latest this can begin',
        seed: timeline => timeline.startDeadlineUTC,
    },
    {
        id: 'preferredEnd',
        label: ['Preferred', 'End'],
        meaning: 'When this would ideally be finished',
        seed: timeline => timeline.endPreferenceUTC,
    },
    {
        id: 'requiredEnd',
        label: ['Required', 'End'],
        meaning: 'The hard deadline',
        seed: timeline => timeline.endDeadlineUTC,
    },
]

/** Which nodes a mode puts in play. */
const NODES_FOR: Record<TimelineMode, NodeId[]> = {
    timeless: [],
    deadline: ['requiredEnd'],
    timeline: ['preferredStart', 'requiredStart', 'preferredEnd', 'requiredEnd'],
}

const MODES: { value: TimelineMode; label: string; colour: string }[] = [
    { value: 'deadline', label: 'Deadline', colour: 'arc.deadlineMode' },
    { value: 'timeline', label: 'Timeline', colour: 'arc.timelineMode' },
    { value: 'timeless', label: 'Timeless', colour: 'arc.timelessMode' },
]

/** One node's two halves, as the pickers hold them. */
interface NodeValue {
    date: Dayjs | null
    time: Dayjs | null
}

type NodeValues = Record<NodeId, NodeValue>

const EMPTY: NodeValues = {
    preferredStart: { date: null, time: null },
    requiredStart: { date: null, time: null },
    preferredEnd: { date: null, time: null },
    requiredEnd: { date: null, time: null },
}

/**
 * A date or time picker sitting on the engraved panel.
 *
 * MUI's outlined input is drawn for a white surface: a near-black notched
 * outline, dark text, and a dark placeholder. On the panel's saturated backdrop
 * all three are dark-on-dark — the two pickers were legible only as a faint
 * rectangle, which reads as the editor being clipped rather than as a control.
 */
const pickerFieldSx = {
    minWidth: 0,
    '& input': { fontSize: '0.7rem', py: 0.6, color: 'arc.onGlassStrong' },
    '& input::placeholder': { color: 'arc.onGlassMuted', opacity: 1 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'arc.glassDivider' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'arc.onGlassMuted' },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'arc.accentOnGlass' },
    '& .MuiSvgIcon-root': { color: 'arc.onGlassMuted', fontSize: '1rem' },
} as const

// ── Geometry ──────────────────────────────────────────────────────────────────

const DOT = 13
const DOT_ROW_HEIGHT = 18
/**
 * The node column's own top padding. The connector has to be positioned against
 * the same number, or it lands above the dots it is meant to join — measured at
 * 2.3px out before this was derived rather than guessed.
 */
const NODE_PAD_Y = 2

// ── Component ─────────────────────────────────────────────────────────────────

export const UpdateTimelinePanel: React.FC<UpdateTimelinePanelProps> = ({
    timeline,
    onDraftChange,
}) => {
    // Mirrors Blazor's OnInitialized() isTimeless / isDeadline() logic.
    const initialMode = (): TimelineMode => {
        if (!timeline) return 'timeless'
        const hasPreferred = timeline.startPreferenceUTC || timeline.endPreferenceUTC
        return hasPreferred ? 'timeline' : 'deadline'
    }

    const [mode, setMode] = useState<TimelineMode>(initialMode)

    // Seeded once from the timeline. Both halves come from the same instant —
    // the API stores one timestamp per field and the pickers split it.
    const [values, setValues] = useState<NodeValues>(() => {
        if (!timeline) return EMPTY
        const seeded = { ...EMPTY }
        for (const node of NODES) {
            const at = node.seed(timeline)
            if (at) seeded[node.id] = { date: dayjs(at), time: dayjs(at) }
        }
        return seeded
    })

    const active = NODES_FOR[mode]
    const [selected, setSelected] = useState<NodeId | null>(null)

    // A node stops being selectable when the mode changes under it.
    const openNode = selected && active.includes(selected) ? selected : null

    const emit = (nextValues: NodeValues, nextMode: TimelineMode) => {
        const on = NODES_FOR[nextMode]
        const dateOf = (id: NodeId) =>
            on.includes(id) ? nextValues[id].date?.toDate() ?? null : null
        const timeOf = (id: NodeId) =>
            on.includes(id) ? nextValues[id].time?.format('HH:mm') ?? null : null

        onDraftChange?.({
            mode: nextMode,
            preferredStart: dateOf('preferredStart'),
            preferredStartTime: timeOf('preferredStart'),
            requiredStart: dateOf('requiredStart'),
            requiredStartTime: timeOf('requiredStart'),
            preferredEnd: dateOf('preferredEnd'),
            preferredEndTime: timeOf('preferredEnd'),
            requiredEnd: dateOf('requiredEnd'),
            requiredEndTime: timeOf('requiredEnd'),
        })
    }

    const setNode = (id: NodeId, half: Partial<NodeValue>) => {
        const next = { ...values, [id]: { ...values[id], ...half } }
        setValues(next)
        emit(next, mode)
    }

    const changeMode = (next: TimelineMode) => {
        setMode(next)
        // Select the only node there is, so Deadline mode needs no second click.
        const on = NODES_FOR[next]
        setSelected(on.length === 1 ? on[0] : null)
        emit(values, next)
    }

    const openSpec = useMemo(() => NODES.find(node => node.id === openNode), [openNode])

    return (
        <Paper
            className="glass-inner-engraved"
            sx={{
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                minWidth: 0,
                minHeight: 0,
                height: '100%',
            }}
        >
            {/* ── Mode ──────────────────────────────────────────────────────── */}
            <Box role="group" aria-label="Timeline mode" sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                {MODES.map(option => {
                    const isOn = mode === option.value
                    return (
                        <Button
                            key={option.value}
                            size="small"
                            aria-pressed={isOn}
                            variant={isOn ? 'contained' : 'outlined'}
                            onClick={() => changeMode(option.value)}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                py: 0.15,
                                fontSize: '0.62rem',
                                lineHeight: 1.6,
                                backgroundColor: isOn ? option.colour : 'transparent',
                                borderColor: option.colour,
                                color: isOn ? 'black' : 'arc.onGlass',
                                ...(isOn ? {} : { opacity: 0.8 }),
                                '&:hover': {
                                    backgroundColor: isOn ? option.colour : 'arc.glassHover',
                                    borderColor: option.colour,
                                },
                            }}
                        >
                            {option.label}
                        </Button>
                    )
                })}
            </Box>

            {/* ── The rail ──────────────────────────────────────────────────── */}
            {active.length === 0 ? (
                <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, py: 2 }}>
                    <Typography sx={{ fontSize: '0.68rem', color: 'arc.onGlassMuted', textAlign: 'center', maxWidth: '34ch' }}>
                        No deadline or timeline set. This card will not appear on the calendar.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
                    {/*
                        The connecting line, inset to the centres of the first and
                        last dots. Each node is an equal fraction of the row, so a
                        node's centre sits at (1 / count / 2) from its own edge —
                        half a node in from each end.
                    */}
                    {active.length > 1 && (
                        <Box
                            aria-hidden
                            sx={{
                                position: 'absolute',
                                left: `${100 / active.length / 2}%`,
                                right: `${100 / active.length / 2}%`,
                                top: NODE_PAD_Y + DOT_ROW_HEIGHT / 2 - 1,
                                height: '2px',
                                backgroundColor: 'arc.railLine',
                            }}
                        />
                    )}

                    {NODES.filter(node => active.includes(node.id)).map(node => {
                        const value = values[node.id]
                        const isSet = Boolean(value.date)
                        const isOpen = openNode === node.id

                        // describeChild, because MUI's Tooltip defaults to acting as
                        // the child's accessible *label*. Without it this button
                        // announced "When this would ideally be finished" instead of
                        // "Preferred End", and the node's own text was unreachable to
                        // a screen reader and to any test looking a control up by
                        // name. As a description it sits alongside the name instead.
                        return (
                            <Tooltip key={node.id} title={node.meaning} placement="top" describeChild>
                                <ButtonBase
                                    onClick={() => setSelected(isOpen ? null : node.id)}
                                    aria-pressed={isOpen}
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        flexDirection: 'column',
                                        borderRadius: 1,
                                        pt: `${NODE_PAD_Y}px`,
                                        pb: 0.25,
                                        '&:hover': { backgroundColor: 'arc.glassHover' },
                                    }}
                                >
                                    {/* Dot */}
                                    <Box
                                        sx={{
                                            height: DOT_ROW_HEIGHT,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: DOT,
                                                height: DOT,
                                                borderRadius: '50%',
                                                border: '2px solid',
                                                borderColor: isOpen ? 'arc.accentOnGlass' : 'arc.onGlass',
                                                // Filled means it has a date. That is the
                                                // whole point of the rail — set and unset
                                                // are distinguishable without reading.
                                                // An unset dot is hollow, but it still
                                                // has to sit *on* the rail rather than
                                                // let the line run through it.
                                                backgroundColor: isSet ? 'arc.accentOnGlass' : 'arc.railNodeEmpty',
                                                boxShadow: isOpen
                                                    ? '0 0 0 3px rgba(154,217,255,.35)'
                                                    : '0 0 0 2px rgba(30,41,59,.35)',
                                            }}
                                        />
                                    </Box>

                                    {/* Label */}
                                    <Typography
                                        sx={{
                                            fontSize: '0.55rem',
                                            lineHeight: 1.25,
                                            textAlign: 'center',
                                            color: isOpen ? 'arc.onGlassStrong' : 'arc.onGlassMuted',
                                            fontWeight: isOpen ? 700 : 400,
                                        }}
                                    >
                                        {node.label[0]}
                                        <br />
                                        {node.label[1]}
                                    </Typography>

                                    {/* What it is set to */}
                                    <Typography
                                        sx={{
                                            fontFamily: '"DM Mono", ui-monospace, monospace',
                                            fontSize: '0.58rem',
                                            lineHeight: 1.4,
                                            textAlign: 'center',
                                            color: isSet ? 'arc.onGlass' : 'arc.onGlassMuted',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {value.date ? value.date.format('DD MMM') : '—'}
                                        {value.time && (
                                            <>
                                                <br />
                                                {value.time.format('HH:mm')}
                                            </>
                                        )}
                                    </Typography>
                                </ButtonBase>
                            </Tooltip>
                        )
                    })}
                </Box>
            )}

            {/*
                The slack. This panel stretches to match the card log beside it,
                and the rail wants to stay under the mode buttons rather than
                float in the middle — so the spare height is put here, explicitly,
                between the rail and the editor pinned below it.
            */}
            <Box sx={{ flex: 1, minHeight: 0 }} />

            {/* ── The selected node's pickers ───────────────────────────────── */}
            {openSpec && (
                <Box
                    sx={{
                        flexShrink: 0,
                        pt: 0.75,
                        borderTop: '1px solid',
                        borderTopColor: 'arc.glassDivider',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.75,
                        alignItems: 'center',
                    }}
                >
                    <Typography
                        sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'arc.onGlassStrong', flex: '1 0 100%' }}
                    >
                        {openSpec.label.join(' ')}
                    </Typography>

                    <DatePicker
                        value={values[openSpec.id].date}
                        onChange={date => setNode(openSpec.id, { date })}
                        format="DD MMM YYYY"
                        slotProps={{
                            textField: {
                                size: 'small',
                                sx: { ...pickerFieldSx, flex: '1 1 9rem' },
                            },
                            openPickerButton: { size: 'small' },
                        }}
                    />

                    <TimePicker
                        value={values[openSpec.id].time}
                        onChange={time => setNode(openSpec.id, { time })}
                        slotProps={{
                            textField: {
                                size: 'small',
                                sx: { ...pickerFieldSx, flex: '1 1 7rem' },
                            },
                            openPickerButton: { size: 'small' },
                        }}
                    />

                    <Button
                        size="small"
                        onClick={() => setNode(openSpec.id, { date: null, time: null })}
                        disabled={!values[openSpec.id].date && !values[openSpec.id].time}
                        sx={{ fontSize: '0.6rem', minWidth: rem(48), color: 'arc.onGlassMuted' }}
                    >
                        Clear
                    </Button>
                </Box>
            )}

            {/* Nothing selected, but nodes exist: say what to do rather than
                leaving a gap where the pickers will appear. */}
            {!openSpec && active.length > 0 && (
                <Typography
                    sx={{ flexShrink: 0, fontSize: '0.6rem', color: 'arc.onGlassMuted', textAlign: 'center' }}
                >
                    Select a point to set its date and time.
                </Typography>
            )}
        </Paper>
    )
}

export default UpdateTimelinePanel
