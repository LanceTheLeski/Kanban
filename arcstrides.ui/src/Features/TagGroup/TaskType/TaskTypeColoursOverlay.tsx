/**
 * TaskTypeColoursOverlay
 *
 * Every task type, and the colour it wears on the calendar: the board's Task
 * types menu (BoardNavBar).
 *
 *   ┌ Task type colours ────────────────────────────────────┐
 *   │ [● Feature] [● Chore] [● Review] [● Docs] …            │
 *   │                                                        │
 *   │ Docs's colour                                          │
 *   │ CHART  ▭ ▭ ▭ ▭ ▭ ▭ ▭ ▭   YOURS ▭  [● Mix…]   Default   │
 *   │                                   Discard   Save       │
 *   └────────────────────────────────────────────────────────┘
 *
 * A type's colour is its mark everywhere it is drawn: the ring round a day's
 * number, its line and its count block, the dot on each of its tasks. Without
 * one of its own it takes a colour of the charts' palette no type has chosen
 * (Calendar.Stats) — and once those run out it is Other's grey, which is what
 * this is for. The chips offered first are that palette, the colours the marks
 * were checked against the day's sand in.
 *
 * Pick a type, then its colour. Each type is drawn in the colour it will have,
 * so the row of types is the preview. Save writes each type changed and puts
 * the new colours in every page's list of types (TaskType.Store); Discard drops
 * them.
 */

import React, { useEffect, useState } from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcColourPicker } from '../../../Components/ArcColourPicker'
import { useBoardActions } from '../../Board/Hooks/useBoardActions'
import { updateTaskTypeColour } from '../../Board/Board.APIs'
import { defaultTypeColour, TYPE_SWATCHES } from '../../Calendar/Calendar.Stats'
import { useTaskTypeStore } from './TaskType.Store'
import type { TaskType } from '../../../Entities/Task/Task.Types'

interface TaskTypeColoursOverlayProps
{
    open: boolean

    onClose: () => void
}

export const TaskTypeColoursOverlay: React.FC<TaskTypeColoursOverlayProps> = ({ open, onClose }) =>
{
    const { run } = useBoardActions()
    const types = useTaskTypeStore(state => state.types)
    const load = useTaskTypeStore(state => state.load)
    const recoloured = useTaskTypeStore(state => state.recoloured)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    // The colours as chosen here, by type, until Save.
    const [drafts, setDrafts] = useState<Map<number, string | null>>(() => new Map())

    useEffect(() =>
    {
        void load()
    }, [load])

    // In the order their palette slots are handed out, so each default is the one beside it.
    const ordered = [...types].sort((a, b) => a.id - b.id)
    const chosenOf = (type: TaskType) => (drafts.has(type.id)
        ? drafts.get(type.id)!
        : type.colour)
    // As the types will be with the colours chosen here, so a default shown is the one Save leaves.
    const drafted = ordered.map(type => ({ ...type, colour: chosenOf(type) }))
    const shownOf = (type: TaskType) => chosenOf(type) ?? defaultTypeColour(type, drafted)
    const selected = ordered.find(type => type.id === selectedId) ?? null
    const changed = ordered.filter(type => drafts.has(type.id) && drafts.get(type.id) !== type.colour)

    const handleSubmit = async () =>
    {
        const saved = await run(changed.length === 1
            ? `Colouring "${changed[0].title}"`
            : `Colouring ${changed.length} task types`,
                                () => Promise.all(changed.map(type => updateTaskTypeColour(type.id, chosenOf(type)))),
                                { refresh: false })
        if (!saved)
            return
        for (const type of changed)
            recoloured(type.id, chosenOf(type))
        onClose()
    }

    return (
        <ArcOverlay open={open}
                    onClose={onClose}
                    onSubmit={handleSubmit}
                    dirty={changed.length > 0}
                    title="Task type colours"
                    titleStock="green">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
                { ordered.length === 0 && (
                    <Typography sx={{ fontSize: '0.8rem', color: 'arc.onGlassMuted' }}>
                        Reading the task types…
                    </Typography>
                )
                }

                {/* The types, each in the colour it will have: pick one to colour it. */}
                { ordered.length > 0 && (
                    <Box role="group"
                         aria-label="Task types"
                         className="card-stock"
                         sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, p: 1 }}>
                        { ordered.map(type =>
                                      (
                                          <ButtonBase key={type.id}
                                                      onClick={() => setSelectedId(type.id)}
                                                      aria-pressed={type.id === selectedId}
                                                      className={type.id === selectedId
                                                          ? 'card-stock card-tilt'
                                                          : 'card-stock-flat card-tilt'}
                                                      sx={{ display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 0.6,
                                                            px: 0.9,
                                                            py: 0.3,
                                                            fontSize: '0.72rem',
                                                            fontWeight: type.id === selectedId
                                                                ? 800
                                                                : 600,
                                                            color: 'arc.onPaperStrong',
                                                            outline: type.id === selectedId
                                                                ? '2px solid'
                                                                : 'none',
                                                            outlineColor: 'arc.paperAccent',
                                                            outlineOffset: 1,
                                                            '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                                                         }}>
                                              <Box component="span"
                                                   aria-hidden
                                                   sx={{ width: 10,
                                                         height: 10,
                                                         borderRadius: '50%',
                                                         flexShrink: 0,
                                                         backgroundColor: shownOf(type)
                                                      }} />
                                              { type.title }
                                          </ButtonBase>
                                      ))
                        }
                    </Box>
                )
                }

                { ordered.length > 0 && !selected && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'arc.onGlassMuted' }}>
                        Choose a type to colour it. Its colour is its mark on every day of the calendar.
                    </Typography>
                )
                }

                {/* Keyed on the type, so each opens the picker from its own colour. */}
                { selected && (
                    <ArcColourPicker key={selected.id}
                                     value={chosenOf(selected)}
                                     onChange={colour => setDrafts(current => new Map(current).set(selected.id, colour))}
                                     fallback={defaultTypeColour({ ...selected, colour: null }, drafted)}
                                     swatches={TYPE_SWATCHES}
                                     swatchesLabel="Chart"
                                     label={`${selected.title}'s colour`} />
                )
                }
            </Box>
        </ArcOverlay>
    )
}

export default TaskTypeColoursOverlay
