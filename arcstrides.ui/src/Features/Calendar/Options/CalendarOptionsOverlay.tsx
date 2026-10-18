/**
 * CalendarOptionsOverlay
 *
 * The calendar's options, from Calendar → Options on its bar.
 *
 *   ┌ Calendar options ─────────────────────────────────────────────────────┐
 *   │ THE WEEKEND    [Sun] Mon Tue Wed Thu Fri [Sat]                        │
 *   │                is  ( none ) ( Work ) (Leisure) (Vacation)             │
 *   │ EVERY OTHER DAY is ( none ) ( Work ) (Leisure) (Vacation)             │
 *   │ KINDS OF DAY                                                          │
 *   │   Work       picture  [city] [park] [beach] [none]                    │
 *   │              progress lines  ●  shown                                 │
 *   │              new tasks start as  [ Feature ▾ ]                        │
 *   │   Leisure    …                                                        │
 *   └───────────────────────────────────────────────────── Discard  Save ───┘
 *
 * ── What it sets ─────────────────────────────────────────────────────────────
 * What a day is when nobody has said: the weekend's days — any of the seven,
 * or none — are one kind, and the rest another; "no theme" is a kind as good
 * as any. And, for each kind, its picture, whether its progress lines show, and
 * the task type a new task on a day of it starts as. A day's own type, chosen
 * on the day, always wins over the first two. See Calendar.DayTypes.
 *
 * ── Saved, not applied as it changes ─────────────────────────────────────────
 * Unlike a day, which changes as you click: these change every day of every
 * month at once, so they are tried here and kept with Save.
 *
 * Mirrors: nothing in Blazor, which had no settings and a type list that was
 * never filled.
 */

import React, { useEffect, useState } from 'react'
import { Box, ButtonBase, FormControlLabel, Switch, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcTitleBar } from '../../../Components/ArcTitleBar'
import { ArcExpandingPicker } from '../../../Components/ArcExpandingPicker'
import { useArcError } from '../../../Components/useArcError'
import { rem } from '../../../Styles/Measures'
import { fetchTaskTypes } from '../../Board/Board.APIs'
import { DayTypeSceneArt } from '../Assets/DayTypeSceneArt'
import { WEEKDAYS } from '../Calendar.Grid'
import { configuredDayType, DAY_TYPES, NO_DAY_TYPE, SCENES, type DayTypeChange, type DayTypeOptions, type Scene } from '../Calendar.DayTypes'
import { useCalendarOptions } from '../Calendar.Options'
import type { TaskType } from '../../../Entities/Task/Task.Types'

interface CalendarOptionsOverlayProps
{
    open: boolean

    onClose: () => void
}

export const CalendarOptionsOverlay: React.FC<CalendarOptionsOverlayProps> = ({ open, onClose }) =>
{
    const saved = useCalendarOptions(state => state.options)
    const save = useCalendarOptions(state => state.save)
    const { addError } = useArcError()
    const [draft, setDraft] = useState<DayTypeOptions>(saved)
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([])

    useEffect(() =>
    {
        fetchTaskTypes([0]).then(setTaskTypes)
                           .catch(() => setTaskTypes([]))
    }, [])

    const toggleDay = (day: number) => setDraft(current =>
    ({
        ...current,
        weekendDays: current.weekendDays.includes(day)
            ? current.weekendDays.filter(other => other !== day)
            : [...current.weekendDays, day].sort(),
    }))

    const change = (typeId: number, next: Partial<DayTypeChange>) => setDraft(current =>
    {
        const type = configuredDayType(typeId, current)
        return {
            ...current,
            changes: {
                ...current.changes,
                [typeId]: { scene: type.scene, progress: type.progress, defaultTaskTypeId: type.defaultTaskTypeId, ...next },
            },
        }
    })

    const handleSubmit = async () =>
    {
        try
        {
            await save(draft)
            onClose()
        }
        catch (error)
        {
            addError(`Saving the calendar's options failed: ${error instanceof Error
                ? error.message
                : String(error)}`)
        }
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    width={rem(640)}
                    title="Calendar options"
                    titleStock="blue"
                    titleCaption="What a day is when nobody has said, and what each kind of day changes">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Section title="The weekend"
                         caption="Its days, and what they are">
                    <Box role="group"
                         aria-label="The weekend's days"
                         sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        { WEEKDAYS.map((name, day) =>
                                       (
                                           <ButtonBase key={name}
                                                       onClick={() => toggleDay(day)}
                                                       aria-pressed={draft.weekendDays.includes(day)}
                                                       aria-label={name}
                                                       className={draft.weekendDays.includes(day)
                                                           ? 'card-stock paper-red'
                                                           : 'card-stock-flat'}
                                                       sx={DAY_CHIP_SX}>
                                               { name.slice(0, 3) }
                                           </ButtonBase>
                                       ))
                        }
                    </Box>
                    <TypeChoice label="Weekend days are"
                                value={draft.weekendTypeId}
                                options={draft}
                                onChange={id => setDraft(current => ({ ...current, weekendTypeId: id }))} />
                </Section>

                <Section title="Every other day"
                         caption="The days that are not the weekend">
                    <TypeChoice label="Every other day is"
                                value={draft.weekdayTypeId}
                                options={draft}
                                onChange={id => setDraft(current => ({ ...current, weekdayTypeId: id }))} />
                </Section>

                <Section title="Kinds of day"
                         caption="Each one's picture, its progress lines, and its new tasks">
                    { DAY_TYPES.map(base =>
                                    {
                                        const type = configuredDayType(base.id, draft)
                                        return (
                                            <Box key={type.id}
                                                 role="group"
                                                 aria-label={type.name}
                                                 className="card-stock-flat"
                                                 sx={{ p: 1,
                                                       display: 'grid',
                                                       gridTemplateColumns: { xs: '1fr', sm: '7rem 1fr' },
                                                       gap: 1
                                                    }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.86rem',
                                                                      fontWeight: 700,
                                                                      color: 'arc.onPaperStrong'
                                                                   }}>
                                                        { type.name }
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.66rem',
                                                                      color: 'arc.onPaperMuted'
                                                                   }}>
                                                        { base.blurb }
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex',
                                                           flexDirection: 'column',
                                                           gap: 0.75,
                                                           minWidth: 0
                                                        }}>
                                                    <SceneChoice name={type.name}
                                                                 value={type.scene}
                                                                 onChange={scene => change(type.id, { scene })} />

                                                    <FormControlLabel sx={{ m: 0, gap: 0.5 }}
                                                                      control={<Switch size="small"
                                                                                       checked={type.progress}
                                                                                       onChange={event => change(type.id, { progress: event.target.checked })} />}
                                                                      label={<Typography sx={{ fontSize: '0.72rem',
                                                                                               color: 'arc.onPaperStrong'
                                                                                            }}>
                                                                                 { type.progress
                                                                                     ? 'Progress lines shown'
                                                                                     : 'No progress lines: the picture takes their place'
                                                                                 }
                                                                             </Typography>} />

                                                    <Box sx={{ display: 'flex',
                                                               alignItems: 'center',
                                                               gap: 1,
                                                               flexWrap: 'wrap'
                                                            }}>
                                                        <Typography sx={{ fontSize: '0.72rem',
                                                                          color: 'arc.onPaperStrong'
                                                                       }}>
                                                            New tasks start as
                                                        </Typography>
                                                        <Box sx={{ flex: '1 1 10rem', minWidth: 0 }}>
                                                            <ArcExpandingPicker options={[NO_DEFAULT, ...taskTypes.map(taskType => taskType.title)]}
                                                                                onSelect={title => change(type.id, { defaultTaskTypeId: taskTypes.find(taskType => taskType.title === title)?.id ?? null })}
                                                                                placeholder={taskTypes.find(taskType => taskType.id === type.defaultTaskTypeId)?.title ?? NO_DEFAULT} />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )
                                    })
                    }
                </Section>
            </Box>
        </ArcOverlay>
    )
}

export default CalendarOptionsOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function Section({ title, caption, children }: { title: string; caption: string; children: React.ReactNode })
{
    return (
        <Box className="card-stock"
             sx={{ p: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ArcTitleBar caption={caption}>{ title }</ArcTitleBar>
            { children }
        </Box>
    )
}

/** A day of the week, as a small square of card: red when it is the weekend's. */
const DAY_CHIP_SX =
{
    minWidth: '2.75rem',
    px: 0.75,
    py: 0.4,
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'arc.onPaperStrong',
    '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 2 },
} as const

/** What a default is: no theme, or one of the kinds, each with its picture as configured. */
function TypeChoice({ label, value, options, onChange }: {
    label: string
    value: number
    options: DayTypeOptions
    onChange: (id: number) => void
})
{
    return (
        <Box role="radiogroup"
             aria-label={label}
             sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
            <Typography aria-hidden
                        sx={{ fontSize: '0.72rem', color: 'arc.onPaperStrong', mr: 0.5 }}>
                { label }
            </Typography>
            { [NO_DAY_TYPE, ...DAY_TYPES].map(base =>
                                              {
                                                  const type = configuredDayType(base.id, options)
                                                  return (
                                                      <Tile key={type.id}
                                                            scene={type.scene}
                                                            name={type.name}
                                                            chosen={value === type.id}
                                                            onPick={() => onChange(type.id)} />
                                                  )
                                              })
            }
        </Box>
    )
}

/** A type's picture: one of the scenes, or none. */
function SceneChoice({ name, value, onChange }: { name: string; value: Scene | null; onChange: (scene: Scene | null) => void })
{
    return (
        <Box role="radiogroup"
             aria-label={`${name}'s picture`}
             sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            { [...SCENES, { scene: null, name: 'None' }].map(option =>
                                                             (
                                                                 <Tile key={option.name}
                                                                       scene={option.scene}
                                                                       name={option.name}
                                                                       chosen={value === option.scene}
                                                                       onPick={() => onChange(option.scene)} />
                                                             ))
            }
        </Box>
    )
}

/** A choice with a picture: its scene, small, and its name under it. Lifted when chosen. */
function Tile({ scene, name, chosen, onPick }: { scene: Scene | null; name: string; chosen: boolean; onPick: () => void })
{
    return (
        <ButtonBase role="radio"
                    aria-checked={chosen}
                    aria-label={name}
                    onClick={onPick}
                    className={chosen
                        ? 'card-stock'
                        : 'card-stock-flat'}
                    sx={{ flexDirection: 'column',
                          gap: 0.25,
                          p: 0.4,
                          transform: chosen
                              ? 'translateY(-2px)'
                              : 'none',
                          outline: chosen
                              ? '2px solid'
                              : 'none',
                          outlineColor: 'arc.paperAccent',
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 2 }
                       }}>
            <Box sx={{ width: 64,
                       height: 32,
                       overflow: 'hidden',
                       borderRadius: '1px',
                       backgroundColor: 'arc.paperField'
                    }}>
                { scene && <DayTypeSceneArt scene={scene} /> }
            </Box>
            <Typography component="span"
                        sx={{ fontSize: '0.64rem', fontWeight: 600, color: 'arc.onPaperStrong' }}>
                { name }
            </Typography>
        </ButtonBase>
    )
}

/** The task-type selector's first entry: no default. */
const NO_DEFAULT = 'No default'
