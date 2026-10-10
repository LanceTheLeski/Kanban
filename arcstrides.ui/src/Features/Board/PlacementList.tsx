/**
 * PlacementList
 *
 * Where a column or a swimlane goes, chosen among the ones there are rather than
 * typed as a number.
 *
 *   Columns, across:     [+] Backlog [+] In progress [ ⠿ New column ] Done [+]
 *   Swimlanes, down:     [+] / Platform / [+] / ⠿ New swimlane / Frontend / [+]
 *
 * The board's own titles, in their own colours, in order, with the one being
 * placed among them, lifted. Between every two, and at either end, is a slot:
 * click one and it goes there. Or drag it, or move it with the arrow keys once
 * it has focus. A new one starts at the end, which is where most things go.
 *
 * Replaces an "Order" field that asked for a number — "Leave blank to append
 * at position 3" — and a list of numbers to pick from when editing. A number
 * is a position you have to count to; a name is one you can see.
 *
 * Mirrors: nothing in Blazor, which had the number.
 */

import React, { useState } from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {
    DndContext,
    DragOverlay,
    MeasuringStrategy,
    PointerSensor,
    pointerWithin,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import { CONDENSED } from '../../Styles/Fonts'
import { labelStyle } from '../../Styles/Stock'

export interface PlacedItem
{
    id: string

    title: string

    /** The colour it is drawn in on the board. */
    colour: string
}

interface PlacementListProps
{
    /** What is there already, in order, without the one being placed. */
    items: PlacedItem[]

    /** The one being placed. */
    moving: Omit<PlacedItem, 'id'>

    /** Where it goes: how many of `items` come before it. */
    index: number

    onChange: (index: number) => void

    /** Across for columns, down for swimlanes, as the board lays them out. */
    direction: 'across' | 'down'

    /** What the list is for, read out: "Where the column goes". */
    label: string
}

export const PlacementList: React.FC<PlacementListProps> = ({ items, moving, index, onChange, direction, label }) =>
{
    const [dragging, setDragging] = useState(false)
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
    const across = direction === 'across'

    return (
        <Box role="group"
             aria-label={label}
             className="card-stock"
             sx={{ p: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'arc.onPaperStrong' }}>
                { label }
            </Typography>

            {/*
                Where the pointer is, not where the dragged chip overlaps most.
                The slots are narrow and the titles wide, so by overlap the chip
                was always "over" a title and never a gap — or, between two
                slots, over nothing. And measured throughout, because the slots
                widen when a drag starts, under the measurements taken before.
            */}
            <DndContext sensors={sensors}
                        collisionDetection={pointerWithin}
                        measuring={MEASURING}
                        onDragStart={() => setDragging(true)}
                        onDragCancel={() => setDragging(false)}
                        onDragEnd={drop}>
                <Box sx={{ display: 'flex',
                           flexDirection: across
                               ? 'row'
                               : 'column',
                           alignItems: across
                               ? 'center'
                               : 'stretch',
                           overflowX: across
                               ? 'auto'
                               : 'visible',
                           py: 0.5,
                           px: 0.25
                        }}>
                    { Array.from({ length: items.length + 1 }, (_, slot) =>
                                                               (
                                                                   <React.Fragment key={slot}>
                                                                       { slot === index
                                                                           ? <Moving title={moving.title}
                                                                                     colour={moving.colour}
                                                                                     across={across}
                                                                                     onStep={step => onChange(clamp(index + step, 0, items.length))} />
                                                                           : <Slot slot={slot}
                                                                                   across={across}
                                                                                   dragging={dragging}
                                                                                   label={slotLabel(slot)}
                                                                                   onPick={() => onChange(slot)} />
                                                                       }
                                                                       { slot < items.length && <Item item={items[slot]}
                                                                                                      slot={slot}
                                                                                                      across={across} />
                                                                       }
                                                                   </React.Fragment>
                                                               ))
                    }
                </Box>

                <DragOverlay>
                    { dragging && <Chip title={moving.title}
                                        colour={moving.colour}
                                        lifted />
                    }
                </DragOverlay>
            </DndContext>
        </Box>
    )

    // ── Private ───────────────────────────────────────────────────────────────
    // Closures over the list above, so they stay with it.

    /** "First", "Between Backlog and In progress", "Last". */
    function slotLabel(slot: number): string
    {
        if (slot === 0)
            return items.length === 0
                ? `Put ${moving.title} here`
                : `Put ${moving.title} first, before ${items[0].title}`
        if (slot === items.length)
            return `Put ${moving.title} last, after ${items[slot - 1].title}`
        return `Put ${moving.title} between ${items[slot - 1].title} and ${items[slot].title}`
    }

    /**
     * A drop on a slot is that slot. A drop on a title is the side of it the
     * pointer is on — so dragging over a title and letting go past its middle
     * puts it after.
     */
    function drop(event: DragEndEvent)
    {
        setDragging(false)
        const target = event.over?.data.current as { slot: number; item?: boolean } | undefined
        if (!target)
            return

        if (!target.item)
        {
            onChange(target.slot)
            return
        }

        // Which side of the title's middle the pointer let go on.
        const pointer = event.activatorEvent as PointerEvent
        const over = event.over!.rect
        const past = across
            ? pointer.clientX + event.delta.x > over.left + over.width / 2
            : pointer.clientY + event.delta.y > over.top + over.height / 2
        onChange(target.slot + (past
            ? 1
            : 0))
    }
}

export default PlacementList

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } }

function clamp(value: number, low: number, high: number): number
{
    return Math.min(Math.max(value, low), high)
}

/** The one being placed: lifted, with a grip, draggable, and moved by the arrow keys. */
function Moving({ title, colour, across, onStep }: {
    title: string
    colour: string
    across: boolean
    onStep: (step: number) => void
})
{
    const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: MOVING })

    const keys = (event: React.KeyboardEvent) =>
    {
        const back = across
            ? 'ArrowLeft'
            : 'ArrowUp'
        const on = across
            ? 'ArrowRight'
            : 'ArrowDown'
        if (event.key === back || event.key === on)
        {
            event.preventDefault()
            onStep(event.key === on
                ? 1
                : -1)
        }
    }

    return (
        <Box ref={setNodeRef}
             {...attributes}
             {...listeners}
             onKeyDown={keys}
             aria-roledescription="movable"
             aria-label={`${title}. Use the arrow keys to move it, or drag it.`}
             sx={{ flexShrink: 0,
                   mx: across
                       ? 0.5
                       : 0,
                   my: across
                       ? 0
                       : 0.4,
                   opacity: isDragging
                       ? 0.35
                       : 1,
                   cursor: 'grab',
                   borderRadius: '3px',
                   '&:focus-visible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 2 }
                }}>
            <Chip title={title}
                  colour={colour}
                  lifted />
        </Box>
    )
}

const MOVING = 'moving'

/** A gap between two titles, as a button that puts the one being placed there. */
function Slot({ slot, across, dragging, label, onPick }: {
    slot: number
    across: boolean
    dragging: boolean
    label: string
    onPick: () => void
})
{
    const { setNodeRef, isOver } = useDroppable({ id: `slot:${slot}`, data: { slot } })

    return (
        <ButtonBase ref={setNodeRef}
                    onClick={onPick}
                    aria-label={label}
                    title={label}
                    sx={{ flexShrink: 0,
                          alignSelf: 'stretch',
                          minWidth: across
                              ? dragging
                                  ? 28
                                  : 16
                              : undefined,
                          minHeight: across
                              ? 24
                              : dragging
                                  ? 22
                                  : 12,
                          mx: across
                              ? 0.25
                              : 0,
                          borderRadius: '3px',
                          transition: 'min-width .12s, min-height .12s, background-color .12s',
                          backgroundColor: isOver
                              ? 'arc.paperSelected'
                              : 'transparent',
                          // Down the list, the mark starts where the titles do, rather than
                          // centred under titles that are not.
                          justifyContent: across
                              ? 'center'
                              : 'flex-start',
                          pl: across
                              ? 0
                              : 0.5,
                          // The gap's mark: a short dashed rule across it, darker on hover.
                          '&::after': { content: '""',
                                        width: across
                                            ? 0
                                            : '7rem',
                                        height: across
                                            ? '60%'
                                            : 0,
                                        borderLeft: across
                                            ? '2px dashed'
                                            : 'none',
                                        borderTop: across
                                            ? 'none'
                                            : '2px dashed',
                                        borderColor: isOver
                                            ? 'arc.paperAccent'
                                            : 'arc.paperDivider' },
                          '&:hover::after, &.Mui-focusVisible::after': { borderColor: 'arc.paperAccent' },
                          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent' }
                       }} />
    )
}

/** One of the titles already there. A drop on it lands before or after it. */
function Item({ item, slot, across }: { item: PlacedItem; slot: number; across: boolean })
{
    const { setNodeRef } = useDroppable({ id: `item:${item.id}`, data: { slot, item: true } })

    return (
        <Box ref={setNodeRef}
             sx={{ flexShrink: 0,
                   display: 'flex',
                   justifyContent: across
                       ? 'center'
                       : 'flex-start'
                }}>
            <Chip title={item.title}
                  colour={item.colour} />
        </Box>
    )
}

/** A title on its own colour, as a small board label. */
function Chip({ title, colour, lifted = false }: { title: string; colour: string; lifted?: boolean })
{
    return (
        <Box className="board-label"
             style={labelStyle(colour)}
             sx={{ display: 'inline-flex',
                   alignItems: 'center',
                   gap: 0.25,
                   maxWidth: '12rem',
                   px: 0.75,
                   py: 0.3,
                   transform: lifted
                       ? 'translateY(-2px)'
                       : 'none',
                   boxShadow: lifted
                       ? '0 3px 6px rgba(30, 24, 16, .3)'
                       : undefined
                }}>
            { lifted && <DragIndicatorIcon aria-hidden
                                           sx={{ fontSize: '0.8rem', color: 'arc.onPaperMuted' }} />
            }
            <Typography component="span"
                        sx={{ fontFamily: CONDENSED,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              color: 'arc.onPaperStrong',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                           }}>
                { title }
            </Typography>
        </Box>
    )
}
