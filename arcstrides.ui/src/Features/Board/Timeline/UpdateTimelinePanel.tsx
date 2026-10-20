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
 * A mode selector, a rail of the points that mode puts in play, and the pickers
 * for whichever point is open. Only one date and one time are on screen at a
 * time rather than eight of both, which is what keeps the panel contained: the
 * rail is about 60px tall whatever is set.
 *
 *   Deadline  just the required end — the common case, one date
 *   Timeline  all four
 *   Timeless  none
 *
 * ── Where the rest of it lives ───────────────────────────────────────────────
 * Timeline.Nodes  the four points, which modes use which, and their values
 * TimelineRail    the line and the nodes standing on it
 * TimelineNode    one dot, its label, and what it is set to
 * Timeline.Draft  folding the draft back into the four timestamps the API stores
 *
 * The split is by structure rather than by mode, because there are not three
 * controls here — there is one, and the mode only says how much of it is live.
 * A file per mode would have had to duplicate the rail, the pickers and the
 * draft three times over to express a difference that is one lookup.
 *
 * ── The draft contract is unchanged ──────────────────────────────────────────
 * TimelineDraft has exactly four date+time pairs, which is why it maps onto four
 * nodes without a translation step.
 *
 * ── Choosing a point's day and time ──────────────────────────────────────────
 * From the calendar, not from a bare date picker: TimelineDatePicker opens the
 * calendar's month, folded down, with what is already on each day; picking a
 * day opens the day, where a click on its hours sets the time. A time is not
 * required. One point at a time, still — a range picker could not express four
 * independent points anyway (and MUI's needs the X Pro licence).
 *
 * ── Ref exposure ─────────────────────────────────────────────────────────────
 * In Blazor, UpdateTaskPopover.cs held @ref="updateTimelinePanel" and read its
 * public fields. Here the panel calls onDraftChange with a structured draft, so
 * nothing reaches into it.
 */

import React, { useMemo, useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Paper, Typography } from '@mui/material'
import { TimelineRail } from './TimelineRail'
import { TimelineDatePicker } from '../../Calendar/DatePicker/TimelineDatePicker'
import type { Subject } from '../../Calendar/Calendar.Stops'
import { MODES, NODES, NODES_FOR, modeOf, seedValues } from './Timeline.Nodes'
import type { NodeId, NodeValue, NodeValues, TimelineMode } from './Timeline.Nodes'
import { draftOf, type TimelineDraft } from './Timeline.Draft'
import { rem } from '../../../Styles/Measures'
import type { Timeline } from '../../../Entities/Timeline/Timeline.Types'

interface UpdateTimelinePanelProps
{
    /** Existing timeline data to pre-fill the nodes — mirrors @bind-Timeline */
    timeline: Timeline | null

    /** Called whenever any node changes */
    onDraftChange?: (draft: TimelineDraft) => void

    /** The board the card is on, so the calendar the points are chosen from counts its deadlines. */
    boardId?: string

    /** The card or task this is the timeline of, whose saved points the calendar leaves out — they are being edited here. */
    subject?: Subject

    /** Its title, as it stands in the editor, for the day's preview. */
    subjectTitle?: string

    /**
     * Shown, not edited: the points can be opened to see them, and nothing
     * changes. A card going by its tasks' dates shows them this way.
     */
    readOnly?: boolean

    /** A card's: where its dates come from, and the box that chooses. */
    inheritance?: TimelineInheritance
}

/** Where a card's dates come from — see Timeline.Inheritance. */
export interface TimelineInheritance
{
    /** True while the card keeps dates of its own. */
    overriding: boolean

    /** How many of its tasks have dates, and how many it has. */
    tasksWithDates: number

    tasks: number

    onOverridingChange: (overriding: boolean) => void
}

export const UpdateTimelinePanel: React.FC<UpdateTimelinePanelProps> = ({
    timeline,
    onDraftChange,
    boardId,
    subject,
    subjectTitle,
    readOnly = false,
    inheritance,
}) =>
{
    const [mode, setMode] = useState<TimelineMode>(() => modeOf(timeline))
    const [values, setValues] = useState<NodeValues>(() => seedValues(timeline))
    // A mode with one point has it open from the start, the way choosing that mode
    // opens it: a deadline loaded back has its day showing, not an empty panel.
    const [selected, setSelected] = useState<NodeId | null>(() => onlyNodeOf(modeOf(timeline)))

    const active = NODES_FOR[mode]

    // A node stops being selectable when the mode changes under it.
    const openNode = selected && active.includes(selected)
        ? selected
        : null
    const openSpec = useMemo(() => NODES.find(node => node.id === openNode), [openNode])
    const activeNodes = useMemo(() => NODES.filter(node => active.includes(node.id)), [active])

    /*
       A rail needs more than one point on it. Deadline mode has exactly one, and
       drawing a lone dot on a line that goes nowhere said less than the date
       itself does — it looked like a timeline with three pieces missing rather
       than like a deadline. With one node the mode just shows that node's date
       and time, in the same fields the rail opens, so the two modes read as the
       same control at different sizes rather than as two designs.
    */
    const showRail = active.length > 1

    /** The stock the chosen tab is cut from, which the section below shares. */
    const activeStock = MODES.find(option => option.value === mode)?.stock ?? ''

    return (
        <Paper className="card-stock"
               sx={{ p: 1,
                     display: 'flex',
                     flexDirection: 'column',
                     gap: 1,
                     minWidth: 0,
                     minHeight: 0,
                     height: '100%'
                  }}>

            {/* ── Mode ──────────────────────────────────────────────────────── */}
            <Box role="group"
                 aria-label="Timeline mode"
                 sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                { MODES.map(option =>
                {
                    const isOn = mode === option.value
                    return (
                        <Button key={option.value}
                                size="small"
                                aria-pressed={isOn}
                                onClick={() => changeMode(option.value)}
                                disabled={readOnly && !isOn}
                                /*
                                   Raised when chosen, flat when not. The state is in
                                   the depth rather than in a fill, so all three keep
                                   their colour and the chosen one is simply the piece
                                   standing proud of the panel.
                                */
                                className={`${isOn
                                    ? 'card-stock'
                                    : 'card-stock-flat'} ${option.stock}`}
                                sx={{ flex: 1,
                                      minWidth: 0,
                                      py: 0.15,
                                      fontSize: '0.62rem',
                                      lineHeight: 1.6,
                                      fontWeight: isOn
                                          ? 700
                                          : 500,
                                      letterSpacing: '0.04em',
                                      color: 'arc.onPaperStrong',
                                      // A flat piece sits back a little, the way an
                                      // unchosen tab would if it were further from the
                                      // light.
                                      opacity: isOn
                                          ? 1
                                          : 0.82,
                                      transform: isOn
                                          ? 'translateY(-1px)'
                                          : 'none',
                                      transition: 'transform .12s, opacity .12s',
                                      '&:hover': { opacity: 1 }
                                   }}>
                            { option.label }
                        </Button>
                    )
                })
                }
            </Box>

            {/*
                ── The mode's own ground ────────────────────────────────────────
                Everything below the tabs sits on a piece of card cut from the
                same stock as the tab that is chosen. So the panel answers "which
                mode is this card in" twice — once by which tab stands proud, and
                once by the colour of everything under it — and the second answer
                is the one you get without looking at the tabs at all.
            */}
            <Box className={`card-stock-flat ${activeStock}`}
                 sx={{ flex: 1,
                       minHeight: 0,
                       display: 'flex',
                       flexDirection: 'column',
                       gap: 1,
                       p: 0.75
                    }}>

            {/* ── The rail ──────────────────────────────────────────────────── */}
            { showRail && (
                <TimelineRail nodes={activeNodes}
                              values={values}
                              openNode={openNode}
                              onToggle={id => setSelected(id === openNode
                                  ? null
                                  : id)} />
            )
            }

            { active.length === 0 && (
                <Box sx={{ flexShrink: 0,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           px: 1,
                           py: 2
                        }}>
                    <Typography sx={{ fontSize: '0.68rem',
                                      color: 'arc.onPaperMuted',
                                      textAlign: 'center',
                                      maxWidth: '34ch'
                                   }}>
                        {/*
                            It used to add "This card will not appear on the
                            calendar", written before the calendar was. It was
                            never true: a card reaches a day through the day's
                            tag group, not through a timeline.
                        */}
                        No deadline or timeline set.
                    </Typography>
                </Box>
            )
            }

            {/*
                The slack. This panel stretches to match the card commands beside
                it, so the spare height has to go somewhere deliberate.

                With a rail, it goes between the rail and the editor: the rail
                belongs under the mode buttons rather than floating in the middle,
                and the pickers belong at the foot.

                Without one — Deadline mode, a single date — it goes after the
                editor instead, so the one control sits under the buttons rather
                than being pushed to the bottom of an otherwise empty panel.
            */}
            { showRail && <Box sx={{ flex: 1, minHeight: 0 }} /> }

            {/* ── The selected node's pickers ───────────────────────────────── */}
            { openSpec && (
                <Box sx={{ flexShrink: 0,
                           pt: 0.75,
                           borderTop: '1px solid',
                           borderTopColor: 'arc.paperDivider',
                           display: 'flex',
                           flexWrap: 'wrap',
                           gap: 0.75,
                           alignItems: 'center'
                        }}>

                    {/* On the rail the four points need telling apart, so they
                        carry their full names. On its own it is just the
                        deadline, and "Required End" is rail jargon there. */}
                    <Typography sx={{ fontSize: '0.6rem',
                                      fontWeight: 700,
                                      color: 'arc.onPaperStrong',
                                      flex: '1 0 100%'
                                   }}>
                        { showRail
                            ? openSpec.label.join(' ')
                            : 'Deadline'
                        }
                    </Typography>

                    <TimelineDatePicker name={showRail
                                            ? openSpec.label.join(' ')
                                            : 'Deadline'}
                                        value={values[openSpec.id]}
                                        onChange={value => setNode(openSpec.id, value)}
                                        boardId={boardId}
                                        subject={subject}
                                        title={subjectTitle}
                                        others={activeNodes.filter(node => node.id !== openSpec.id)
                                                           .map(node => ({ label: node.label.join(' '), value: values[node.id] }))}
                                        disabled={readOnly} />

                    { !readOnly && (
                        <Button size="small"
                                onClick={() => setNode(openSpec.id, { date: null, time: null })}
                                disabled={!values[openSpec.id].date && !values[openSpec.id].time}
                                sx={{ fontSize: '0.6rem', minWidth: rem(48), color: 'arc.onPaperMuted' }}>
                            Clear
                        </Button>
                    )
                    }
                </Box>
            )
            }

            { !showRail && <Box sx={{ flex: 1, minHeight: 0 }} /> }

            {/* Nothing selected, but nodes exist: say what to do rather than
                leaving a gap where the pickers will appear. */}
            { !openSpec && showRail && (
                <Typography sx={{ flexShrink: 0,
                                  fontSize: '0.6rem',
                                  color: 'arc.onPaperMuted',
                                  textAlign: 'center'
                               }}>
                    { readOnly
                        ? 'Select a point to see its date and time.'
                        : 'Select a point to set its date and time.'
                    }
                </Typography>
            )
            }
            </Box>

            { inheritance && <InheritanceSegment inheritance={inheritance} /> }
        </Paper>
    )

    // ── Private ───────────────────────────────────────────────────────────────
    // Closures over the state above, so they stay with the component rather than
    // moving to Timeline.Nodes. Ordered by first use.

    function changeMode(next: TimelineMode)
    {
        setMode(next)
        // Select the only node there is, so Deadline mode needs no second click.
        setSelected(onlyNodeOf(next))
        emit(values, next)
    }

    function setNode(id: NodeId, half: Partial<NodeValue>)
    {
        const next = { ...values, [id]: { ...values[id], ...half } }
        setValues(next)
        emit(next, mode)
    }

    /** Reports the draft as the parent wants it — see draftOf. */
    function emit(nextValues: NodeValues, nextMode: TimelineMode)
    {
        onDraftChange?.(draftOf(nextValues, nextMode))
    }
}

export default UpdateTimelinePanel

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The one point a mode puts in play, when it has only one — Deadline's. */
function onlyNodeOf(mode: TimelineMode): NodeId | null
{
    const on = NODES_FOR[mode]
    return on.length === 1
        ? on[0]
        : null
}

/**
 * The foot of a card's timeline: whether its dates are its tasks' or its own,
 * and the box that chooses — "Inherit timeline info from tasks".
 *
 * Ticked, the default, the card takes its tasks' dates: the earliest of their
 * starts and the latest of their ends (Timeline.Inheritance). Unticked, it keeps
 * dates of its own, starting from the ones it had; its tasks keep theirs either
 * way. The box says what is taken rather than what is kept, so the usual case is
 * the ticked one.
 */
function InheritanceSegment({ inheritance }: { inheritance: TimelineInheritance })
{
    const { overriding, tasksWithDates, tasks, onOverridingChange } = inheritance

    return (
        <Box role="group"
             aria-label="Where the card's dates come from"
             sx={{ flexShrink: 0,
                   pt: 0.75,
                   borderTop: '1px solid',
                   borderTopColor: 'arc.paperDivider',
                   display: 'flex',
                   flexDirection: 'column',
                   gap: 0.25
                }}>
            <Typography sx={{ fontSize: '0.64rem', color: 'arc.onPaperStrong', lineHeight: 1.45 }}>
                { inheritanceNote(overriding, tasksWithDates, tasks) }
            </Typography>
            <FormControlLabel sx={{ m: 0, '& .MuiCheckbox-root': { p: 0.4 } }}
                              control={<Checkbox size="small"
                                                 checked={!overriding}
                                                 onChange={event => onOverridingChange(!event.target.checked)} />}
                              label={<Typography sx={{ fontSize: '0.66rem',
                                                       fontWeight: 600,
                                                       color: 'arc.onPaperStrong'
                                                    }}>
                                         Inherit timeline info from tasks
                                     </Typography>} />
        </Box>
    )
}

function inheritanceNote(overriding: boolean, tasksWithDates: number, tasks: number): string
{
    if (overriding)
        return "The card's own dates. Its tasks keep theirs, and still show under it on their own days."
    if (tasks === 0)
        return 'Taken from its tasks — it has none yet. Add one with dates, or untick the box to give the card dates of its own.'
    if (tasksWithDates === 0)
        return 'Taken from its tasks — none of them has dates yet. When one does, the card has them too.'
    return `Taken from its tasks — ${tasksWithDates} of ${tasks} ${tasks === 1
        ? 'has'
        : 'have'} dates: the earliest of their starts and the latest of their ends.`
}
