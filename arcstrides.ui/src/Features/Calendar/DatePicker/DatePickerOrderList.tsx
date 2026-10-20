/**
 * DatePickerOrderList
 *
 * The day's timed things in order, on a timeline with no clock, and a place
 * before, between and after them to put the point: the day step's Relative
 * mode (DatePickerTimeStep), which is the mode it opens in.
 *
 *     ┃
 *     ∘  + here                            a place: a small grey node
 *     ●  Breakfast · Morning routine  1 h  a thing on the day, in its type's colour
 *     ◉  Deadline · 2 h               (i)  the point, its node filled — red if it
 *     ●  Lunch · Errands              1 h  does not fit
 *     ∘  + here
 *     ┃
 *
 * The same gold rail the hour scale and the day overlay's timeline stand on,
 * with each thing a node on it, so the two modes read as one timeline with and
 * without its hours. A place is a node too, kept small and grey until the point
 * is put there; then it is filled with the point's colour, still small, so the
 * things on the day stay the larger marks.
 *
 * A point put in a place is given the time the thing before it ends — see
 * Calendar.RelativePlacement, which works out the places and whether the point
 * fits. One that overlaps anything is put there all the same, its node red, with
 * a note behind (i) saying why. On a day with nothing timed there is one place,
 * and a point put there is at noon. Nothing here shows a clock: the order is the
 * point.
 *
 * There is a place between every two things, those at the same moment or
 * overlapping included.
 */

import React, { useState } from 'react'
import { Box, ButtonBase, IconButton, Popover, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { durationLabel } from '../../Board/Timeline/Timeline.Nodes'
import { misfitReason, type PlacedItem } from '../Calendar.RelativePlacement'

/** One thing on the day, as the list draws it. */
export interface OrderItem
{
    key: string

    /** The card's title. */
    title: string

    /**
     * What it is called in a sentence — "between Breakfast and Lunch": its task's
     * title, or the card's for a point of the card's own. Two tasks on one card
     * would otherwise both be the card.
     */
    name: string

    /** Which task and which point — or that the point is the card's own, or this one's. */
    caption: string

    /** The task's type colour; null for one of the subject's own points, drawn hollow. */
    colour: string | null

    /** Minutes; null for an instant. */
    length: number | null

    done: boolean
}

interface DatePickerOrderListProps
{
    /** In order — see inOrder. */
    items: PlacedItem<OrderItem>[]

    /** What is being set: "Deadline". */
    name: string

    /** The gap the point is in, or null for no time — see gapOf. */
    at: number | null

    /** Whether the point overlaps nothing where it is — see fitsAt. */
    fits: boolean

    duration: number | null

    /** Puts the point in the gap at `index` — see Calendar.RelativePlacement. */
    onPlace: (index: number) => void
}

export const DatePickerOrderList: React.FC<DatePickerOrderListProps> = ({ items, name, at, fits, duration, onPlace }) =>
{
    const rows: React.ReactNode[] = []
    for (let index = 0; index <= items.length; index++)
    {
        rows.push(at === index
            ? (
                <PointRow key={`gap:${index}`}
                          name={name}
                          duration={duration}
                          reason={fits
                              ? null
                              : misfitReason(items, index, duration, item => item.name)} />
            )
            : (
                <Place key={`gap:${index}`}
                       label={`Put the ${name.toLowerCase()} ${placeLabel(items, index)}`}
                       onClick={() => onPlace(index)} />
            ))
        if (index < items.length)
            rows.push(<ItemRow key={items[index].item.key}
                               item={items[index].item} />)
    }

    return (
        // The scroller is round the list, so the rail — the list's background — runs its whole length.
        <Box className="card-stock-flat"
             sx={{ maxHeight: LIST_HEIGHT, overflowY: 'auto' }}>
            { items.length === 0 && (
                <Typography sx={{ px: 1,
                                  pt: 1,
                                  fontSize: '0.64rem',
                                  color: 'arc.onPaperMuted',
                                  lineHeight: 1.4
                               }}>
                    Nothing on this day has a time: put the { name.toLowerCase() } here, and it is at noon.
                </Typography>
            )
            }
            <Box component="ol"
                 aria-label={`The day in order: where the ${name.toLowerCase()} goes`}
                 sx={{ m: 0,
                       pl: 0,
                       pr: 0.75,
                       py: 1,
                       listStyle: 'none',
                       display: 'flex',
                       flexDirection: 'column',
                       gap: 0.35,
                       // The rail: the day's gold strip, from the first node to the last.
                       backgroundImage: 'linear-gradient(var(--arc-yellow-mid), var(--arc-yellow-mid))',
                       backgroundRepeat: 'no-repeat',
                       backgroundSize: `${RAIL_WIDTH}px calc(100% - 20px)`,
                       backgroundPosition: `${NODE_COLUMN / 2 - RAIL_WIDTH / 2}px 10px`
                    }}>
                { rows }
            </Box>
        </Box>
    )
}

export default DatePickerOrderList

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** As tall as the hour scale it stands in for, so the step does not jump when the mode changes. */
const LIST_HEIGHT = 270

/** The column the nodes stand in, the rail down its middle; and the rail's width. In px. */
const NODE_COLUMN = 26

const RAIL_WIDTH = 4

/** "before Breakfast", "between Breakfast and Lunch", "after Lunch", "at noon". */
function placeLabel(items: PlacedItem<OrderItem>[], index: number): string
{
    if (items.length === 0)
        return 'at noon'
    if (index === 0)
        return `before ${items[0].item.name}`
    if (index === items.length)
        return `after ${items[index - 1].item.name}`
    return `between ${items[index - 1].item.name} and ${items[index].item.name}`
}

/** The point, in its place: its small node filled — blue, or red with the reason behind (i). */
function PointRow({ name, duration, reason }: { name: string; duration: number | null; reason: string | null })
{
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)

    return (
        <Box component="li"
             aria-label={`The ${name.toLowerCase()}${duration
                 ? `, ${durationLabel(duration)}`
                 : ''}, placed here${reason
                     ? ' — it does not fit'
                     : ''}`}
             sx={{ display: 'flex', alignItems: 'center', minHeight: 22 }}>
            <Node size={PLACE_NODE}
                  fill={reason
                      ? 'var(--arc-red-deep)'
                      : 'var(--arc-blue-deep)'} />
            <Box className={reason
                     ? 'card-stock-flat paper-red'
                     : 'card-stock-flat paper-blue'}
                 sx={{ flex: 1,
                       minWidth: 0,
                       display: 'flex',
                       alignItems: 'center',
                       gap: 0.5,
                       px: 0.75,
                       py: 0.2
                    }}>
                <Typography component="span"
                            sx={{ flex: 1, fontSize: '0.7rem', fontWeight: 700, color: 'arc.onPaperStrong' }}>
                    { name }{ duration
                        ? ` · ${durationLabel(duration)}`
                        : ''
                            }
                </Typography>
                { reason && (
                    <>
                        <IconButton size="small"
                                    onClick={event => setAnchor(event.currentTarget)}
                                    aria-label="Why it does not fit"
                                    aria-haspopup="dialog"
                                    sx={{ p: 0.15, color: 'arc.paperDanger' }}>
                            <InfoOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                        </IconButton>
                        <Popover open={anchor !== null}
                                 anchorEl={anchor}
                                 onClose={() => setAnchor(null)}
                                 anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                 transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                 slotProps={{ paper: { className: 'card-stock',
                                                       role: 'dialog',
                                                       'aria-label': 'Why it does not fit',
                                                       sx: { p: 1.25, maxWidth: 260 }
                                                    }
                                           }}>
                            <Typography sx={{ fontSize: '0.7rem',
                                              lineHeight: 1.5,
                                              color: 'arc.onPaperStrong'
                                           }}>
                                { reason }
                            </Typography>
                        </Popover>
                    </>
                )
                }
            </Box>
        </Box>
    )
}

/** A place's node: small whether chosen or not, so the things on the day stay the larger marks. */
const PLACE_NODE = 8

/** A thing's node. */
const ITEM_NODE = 11

/** A node on the rail, in the node column: filled, or a ring when `fill` is null. */
function Node({ size, fill }: { size: number; fill: string | null })
{
    return (
        <Box aria-hidden
             sx={{ width: NODE_COLUMN, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
            <Box sx={{ width: size,
                       height: size,
                       borderRadius: '50%',
                       backgroundColor: fill ?? 'var(--arc-paper)',
                       border: fill
                           ? 'none'
                           : '2px solid var(--arc-blue-deep)',
                       boxShadow: '0 0 0 2px var(--arc-paper)'
                    }} />
        </Box>
    )
}

/** A place the point can go: a small grey node on the rail, darkening when pointed at, and "+ here". */
function Place({ label, onClick }: { label: string; onClick: () => void })
{
    return (
        <Box component="li">
            <ButtonBase onClick={onClick}
                        aria-label={label}
                        sx={{ width: '100%',
                              minHeight: 18,
                              justifyContent: 'flex-start',
                              borderRadius: '2px',
                              fontSize: '0.6rem',
                              color: 'arc.onPaperMuted',
                              '& .place-node': { backgroundColor: 'arc.onPaperMuted' },
                              '&:hover': { backgroundColor: 'arc.paperHover', color: 'arc.onPaperStrong' },
                              '&:hover .place-node, &.Mui-focusVisible .place-node': { backgroundColor: 'arc.paperAccent' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                           }}>
                <Box aria-hidden
                     sx={{ width: NODE_COLUMN, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                    <Box className="place-node"
                         sx={{ width: PLACE_NODE,
                               height: PLACE_NODE,
                               borderRadius: '50%',
                               boxShadow: '0 0 0 2px var(--arc-paper)'
                            }} />
                </Box>
                + here
            </ButtonBase>
        </Box>
    )
}

/** One thing on the day: its node in its type's colour, its card and what of it, and how long it lasts. */
function ItemRow({ item }: { item: OrderItem })
{
    return (
        <Box component="li"
             sx={{ display: 'flex', alignItems: 'center', minWidth: 0, minHeight: 20 }}>
            <Node size={ITEM_NODE}
                  fill={item.colour} />
            <Typography component="span"
                        sx={{ flex: 1,
                              minWidth: 0,
                              fontSize: '0.66rem',
                              color: 'arc.onPaper',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textDecoration: item.done
                                  ? 'line-through'
                                  : 'none'
                           }}>
                <Box component="span"
                     sx={{ fontWeight: 600 }}>
                    { item.title }
                </Box>
                <Box component="span"
                     sx={{ color: 'arc.onPaperMuted' }}>
                    { ` · ${item.caption}` }
                </Box>
            </Typography>
            { item.length && (
                <Typography component="span"
                            sx={{ flexShrink: 0, fontSize: '0.6rem', color: 'arc.onPaperMuted' }}>
                    { durationLabel(item.length) }
                </Typography>
            )
            }
        </Box>
    )
}
