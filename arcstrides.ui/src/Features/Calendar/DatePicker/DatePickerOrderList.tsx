/**
 * DatePickerOrderList
 *
 * The day's timed things in order, with no times on them, and a place between
 * each two to put the point: the day step's Relative mode (DatePickerTimeStep).
 *
 *     + here                                   before the first
 *     ● Breakfast · Morning routine      1 h
 *     ■ Deadline · 2 h                   (i)   the point, red if it does not fit
 *     ● Lunch · Errands                  1 h
 *     + here                                   after the last
 *
 * A point put in a place is given the time the thing before it ends — see
 * Calendar.RelativePlacement, which works out the places and whether the point
 * fits. One too long for its place is put there all the same, drawn red, with
 * a note behind (i) saying why. Nothing here shows a clock: the order is the
 * point.
 *
 * Things that overlap are one block, with no place between them: nothing can
 * go between two things happening at once.
 */

import React, { useState } from 'react'
import { Box, ButtonBase, IconButton, Popover, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { durationLabel } from '../../Board/Timeline/Timeline.Nodes'
import { fitsAt, gapOf, misfitReason, type ItemGroup } from '../Calendar.RelativePlacement'

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
    groups: ItemGroup<OrderItem>[]

    /** What is being set: "Deadline". */
    name: string

    /** The point's time, in minutes from midnight; null for none. */
    minutes: number | null

    duration: number | null

    /** Puts the point in the gap at `index` — see Calendar.RelativePlacement. */
    onPlace: (index: number) => void
}

export const DatePickerOrderList: React.FC<DatePickerOrderListProps> = ({ groups, name, minutes, duration, onPlace }) =>
{
    if (groups.length === 0)
        return (
            <Typography className="card-stock-flat"
                        sx={{ px: 1, py: 1, fontSize: '0.68rem', color: 'arc.onPaper', lineHeight: 1.5 }}>
                Nothing on this day has a time, so there is nothing to put the { name.toLowerCase() } among:
                it is on the day, with no time.
            </Typography>
        )

    const at = minutes === null
        ? null
        : gapOf(groups, minutes)
    const fits = minutes === null || fitsAt(groups, minutes, duration)

    return (
        <Box component="ol"
             aria-label={`The day in order: where the ${name.toLowerCase()} goes`}
             className="card-stock-flat"
             sx={{ m: 0,
                   p: 0.75,
                   listStyle: 'none',
                   display: 'flex',
                   flexDirection: 'column',
                   gap: 0.4,
                   maxHeight: LIST_HEIGHT,
                   overflowY: 'auto'
                }}>
            { Array.from({ length: groups.length + 1 }, (_, index) =>
                                                        (
                                                            <React.Fragment key={index}>
                                                                { at === index
                                                                    ? (
                                                                          <PointRow name={name}
                                                                                    duration={duration}
                                                                                    reason={fits
                                                                                        ? null
                                                                                        : misfitReason(groups, index, duration, nameOf)} />
                                                                      )
                                                                    : (
                                                                          <Box component="li">
                                                                              <ButtonBase onClick={() => onPlace(index)}
                                                                                          aria-label={`Put the ${name.toLowerCase()} ${placeLabel(groups, index)}`}
                                                                                          sx={{ width: '100%',
                                                                                                justifyContent: 'flex-start',
                                                                                                px: 1,
                                                                                                py: 0.2,
                                                                                                border: '1px dashed',
                                                                                                borderColor: 'arc.paperDivider',
                                                                                                borderRadius: '2px',
                                                                                                fontSize: '0.62rem',
                                                                                                color: 'arc.onPaperMuted',
                                                                                                '&:hover': { backgroundColor: 'arc.paperHover', color: 'arc.onPaperStrong' },
                                                                                                '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                                                                                             }}>
                                                                                  + here
                                                                              </ButtonBase>
                                                                          </Box>
                                                                      )
                                                                }
                                                                { index < groups.length && <GroupRow group={groups[index]} /> }
                                                            </React.Fragment>
                                                        ))
            }
        </Box>
    )
}

export default DatePickerOrderList

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** As tall as the hour scale it stands in for, so the step does not jump when the mode changes. */
const LIST_HEIGHT = 270

/** A group by name: its first thing's, and how many more. */
function nameOf(group: ItemGroup<OrderItem>): string
{
    const first = group.items[0].item.name
    return group.items.length === 1
        ? first
        : `${first} and ${group.items.length - 1} more`
}

/** "before Breakfast", "between Breakfast and Lunch", "after Lunch". */
function placeLabel(groups: ItemGroup<OrderItem>[], index: number): string
{
    if (index === 0)
        return `before ${nameOf(groups[0])}`
    if (index === groups.length)
        return `after ${nameOf(groups[index - 1])}`
    return `between ${nameOf(groups[index - 1])} and ${nameOf(groups[index])}`
}

/** The point, in its place: blue, or red with the reason behind (i) when it does not fit. */
function PointRow({ name, duration, reason }: { name: string; duration: number | null; reason: string | null })
{
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)

    return (
        <Box component="li"
             className={reason
                 ? 'card-stock paper-red'
                 : 'card-stock paper-blue'}
             aria-label={`The ${name.toLowerCase()}${duration
                 ? `, ${durationLabel(duration)}`
                 : ''}, placed here${reason
                     ? ' — it does not fit'
                     : ''}`}
             sx={{ display: 'flex',
                   alignItems: 'center',
                   gap: 0.5,
                   px: 1,
                   py: 0.35,
                   boxShadow: reason
                       ? 'inset 3px 0 0 var(--arc-red-deep)'
                       : undefined
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
                                sx={{ p: 0.25, color: 'arc.paperDanger' }}>
                        <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
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
                        <Typography sx={{ fontSize: '0.7rem', lineHeight: 1.5, color: 'arc.onPaperStrong' }}>
                            { reason }
                        </Typography>
                    </Popover>
                </>
            )
            }
        </Box>
    )
}

/** One thing on the day, or several that overlap, as one block. */
function GroupRow({ group }: { group: ItemGroup<OrderItem> })
{
    return (
        <Box component="li"
             aria-label={group.items.length > 1
                 ? `${group.items.length} things at the same time`
                 : undefined}
             sx={{ display: 'flex',
                   flexDirection: 'column',
                   gap: 0.2,
                   pl: 0.5,
                   borderLeft: group.items.length > 1
                       ? '2px solid'
                       : 'none',
                   borderLeftColor: 'arc.paperDivider'
                }}>
            { group.items.map(({ item }) =>
                              (
                                  <Box key={item.key}
                                       sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
                                      <Box aria-hidden
                                           sx={{ width: 8,
                                                 height: 8,
                                                 flexShrink: 0,
                                                 borderRadius: '50%',
                                                 backgroundColor: item.colour ?? 'var(--arc-paper)',
                                                 border: item.colour
                                                     ? 'none'
                                                     : '2px solid var(--arc-blue-deep)'
                                              }} />
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
                                                      sx={{ flexShrink: 0,
                                                            fontSize: '0.6rem',
                                                            color: 'arc.onPaperMuted'
                                                         }}>
                                              { durationLabel(item.length) }
                                          </Typography>
                                      )
                                      }
                                  </Box>
                              ))
            }
        </Box>
    )
}
