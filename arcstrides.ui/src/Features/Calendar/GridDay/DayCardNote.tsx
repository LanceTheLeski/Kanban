/**
 * DayCardNote
 *
 * A card on a day, wrapped round its tasks.
 *
 * Mirrors: the card MudPaper in CalendarDate.razor — the card's title, and under
 * it each of its tasks as a row that opened that task's UpdateTaskPopover. From
 * a date, the tasks are the point; the card is what holds them together. So the
 * card is the note it is on the board, and each task is the same strip of green
 * card it is in the card editor, with the same popover behind it.
 *
 * Which tasks show is the day's current view's business — see Calendar.Views —
 * so this takes them separately from the card. The card's own task count is
 * still the whole card's: a view narrows what is listed, not what is true.
 *
 * ── What falls on the day ────────────────────────────────────────────────────
 * On the grid, nothing about times: a day there says which cards and tasks are
 * connected to it, and the room times took goes to the tasks' names. The times
 * are in the day overlay, where the larger note (`medium`) says what of the
 * card falls on the day, from its entry (Calendar.Stops, DayCardEntry): why it
 * is there — put on the day, due on it, or both — a yellow tab on its title,
 * the Deadline tab's stock, with the time of its first point ("Due" with none),
 * the card's own dates if it keeps them, and on each task its point and when.
 *
 * ── Saved now, or with the day ───────────────────────────────────────────────
 * On the grid a task's popover writes on its own Save. In the day overlay it
 * says Done, and the edit waits for the day's Save (stageTask, useDayDraft).
 *
 * ── Two targets, never nested ────────────────────────────────────────────────
 * The title opens the card; a task opens its popover. The note itself is not a
 * button, because a button holding buttons is two targets that cannot tell
 * which one was meant.
 */

import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { MONO } from '../../../Styles/Fonts'
import { UpdateTaskPopover } from '../../Board/Task/UpdateTaskPopover'
import { colourOf } from '../Calendar.Stats'
import { useCalendarActions } from '../Calendar.Context'
import { pointName, pointsOf, type DayCardEntry, type Stop } from '../Calendar.Stops'
import { spanLabel } from '../../Board/Timeline/Timeline.Nodes'
import { taskKey } from '../../Board/Task/Task.Staging'
import type { Card } from '../../../Entities/Card/Card.Types'
import type { Task } from '../../../Entities/Task/Task.Types'

interface DayCardNoteProps
{
    card: Card

    /** The tasks the day's view keeps. */
    tasks: Task[]

    /** The grid's is compact; the day overlay's has room to breathe. */
    size?: 'small' | 'medium'

    /**
     * Which board the card is on, for a day that holds cards from more than one
     * — where two cards can share a name and nothing else would tell them apart.
     */
    boardCaption?: string

    /** Why the card is on the day, and what of it falls on the day. */
    entry?: DayCardEntry

    /** A preview: the card does not open and its tasks are not edited. */
    readOnly?: boolean
}

export const DayCardNote: React.FC<DayCardNoteProps> = ({ card, tasks, size = 'small', boardCaption, entry, readOnly = false }) =>
{
    const { colours, openCard, taskUpdated, stageTask } = useCalendarActions()
    const medium = size === 'medium'
    const done = card.tasks.filter(task => task.isCompleted).length
    const total = card.tasks.length
    const points = entry
        ? pointsOf(entry)
        : []
    const first = points.find(stop => stop.timed) ?? points[0]
    const pointOfTask = (taskId: string) => entry?.taskPoints.filter(stop => stop.task?.id === taskId) ?? []

    return (
        <Box className="note"
             sx={{ width: '100%',
                   minWidth: 0,
                   display: 'flex',
                   flexDirection: 'column',
                   gap: medium
                       ? 0.5
                       : 0.3,
                   p: medium
                       ? 0.75
                       : 0.4
                }}>
            <ButtonBase onClick={() => openCard(card)}
                        disabled={readOnly}
                        aria-label={total > 0
                            ? `Open card ${card.title}, ${done} of ${total} tasks done`
                            : `Open card ${card.title}`}
                        sx={{ display: 'flex',
                              alignItems: 'baseline',
                              justifyContent: 'space-between',
                              gap: 0.5,
                              px: 0.25,
                              borderRadius: '1px',
                              textAlign: 'left',
                              '&:hover': { backgroundColor: 'arc.paperHover' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 }
                           }}>
                {/* The title and its due tab together, so the tab sits by the name and the count at the end. */}
                <Box component="span"
                     sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, minWidth: 0 }}>
                    <Typography component="span"
                                sx={{ fontSize: medium
                                          ? '0.8rem'
                                          : '0.64rem',
                                      fontWeight: 700,
                                      lineHeight: 1.3,
                                      minWidth: 0,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      overflowWrap: 'anywhere'
                                   }}>
                        { card.title || 'Untitled' }
                    </Typography>
                    { medium && first && (
                        <Box component="span"
                             className="card-stock-flat paper-yellow"
                             sx={{ flexShrink: 0,
                                   px: 0.4,
                                   fontFamily: MONO,
                                   fontSize: '0.66rem',
                                   fontWeight: 700,
                                   color: 'arc.onPaperStrong'
                                }}>
                            { first.timed
                                ? spanLabel(first.at, null, first.relative)
                                : 'Due'
                            }
                        </Box>
                    )
                    }
                </Box>
                { total > 0 && (
                    <Box component="span"
                         sx={{ flexShrink: 0,
                               fontFamily: MONO,
                               fontSize: medium
                                   ? '0.7rem'
                                   : '0.56rem',
                               color: 'arc.onPaperMuted'
                            }}>
                        { done }/{ total }
                    </Box>
                )
                }
            </ButtonBase>

            {/* Why it is on the day, in the overlay, where there is room to say. */}
            { medium && entry && (
                <Typography sx={{ mt: -0.35, px: 0.25, fontSize: '0.62rem', color: 'arc.onPaperMuted' }}>
                    { reasonOf(entry) }
                </Typography>
            )
            }

            {/* A card keeping dates of its own: those that fall on the day, in the overlay. */}
            { medium && entry?.own.map(stop =>
                                       (
                                           <Typography key={stop.node.id}
                                                       sx={{ px: 0.25,
                                                             fontFamily: MONO,
                                                             fontSize: '0.66rem',
                                                             color: 'arc.onPaper'
                                                          }}>
                                               The card's { pointName(stop).toLowerCase() } · { whenOf(stop) }
                                           </Typography>
                                       ))
            }

            { boardCaption && (
                <Typography sx={{ mt: -0.35,
                                  px: 0.25,
                                  fontSize: medium
                                      ? '0.62rem'
                                      : '0.52rem',
                                  color: 'arc.onPaperMuted'
                               }}>
                    { boardCaption }
                </Typography>
            )
            }

            { tasks.map(task =>
                        (
                            <Box key={task.id}
                                 className="card-stock-flat paper-green"
                                 sx={{ display: 'flex',
                                       alignItems: 'center',
                                       gap: 0.4,
                                       pl: medium
                                           ? 0.75
                                           : 0.45,
                                       minWidth: 0
                                    }}>
                                {/*
                                    The type's mark: the colour its segment has in the ring,
                                    so a row can be matched to the graph above it. Named in
                                    the tooltip and in the popover, so the colour is never
                                    the only way to tell.
                                */}
                                <Box aria-hidden
                                     title={task.taskType?.title ?? 'No type'}
                                     sx={{ width: medium
                                               ? 8
                                               : 6,
                                           height: medium
                                               ? 8
                                               : 6,
                                           borderRadius: '50%',
                                           flexShrink: 0,
                                           backgroundColor: colourOf(task.taskType?.id, colours)
                                        }} />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {/*
                                        Keyed on the values the popover seeds its draft from,
                                        as the card editor keys its rows, so a saved or staged
                                        change remounts it with the new values.
                                    */}
                                    { readOnly
                                        ? (
                                              <Typography sx={{ px: 0.25,
                                                                py: medium
                                                                    ? 0.4
                                                                    : 0.2,
                                                                fontSize: medium
                                                                    ? '0.74rem'
                                                                    : '0.6rem',
                                                                color: 'arc.onPaper',
                                                                textDecoration: task.isCompleted
                                                                    ? 'line-through'
                                                                    : 'none',
                                                                overflowWrap: 'anywhere'
                                                             }}>
                                                  { task.title }
                                              </Typography>
                                          )
                                        : (
                                                <UpdateTaskPopover key={taskKey(task)}
                                                                   task={task}
                                                                   onStage={stageTask
                                                                       ? edit => stageTask(card, edit)
                                                                       : undefined}
                                                                   boardId={card.boardId}
                                                                   cardId={card.id}
                                                                   tasksCount={card.tasks.length}
                                                                   onUpdated={taskUpdated}
                                                                   triggerSize="small"
                                                                   triggerSx={{ width: '100%',
                                                                                minWidth: 0,
                                                                                minHeight: 0,
                                                                                justifyContent: 'flex-start',
                                                                                textAlign: 'left',
                                                                                backgroundColor: 'transparent',
                                                                                color: 'arc.onPaper',
                                                                                fontSize: medium
                                                                                    ? '0.74rem'
                                                                                    : '0.6rem',
                                                                                lineHeight: 1.3,
                                                                                py: medium
                                                                                    ? 0.4
                                                                                    : 0.2,
                                                                                px: 0.25,
                                                                                overflowWrap: 'anywhere'
                                                                             }} />
                                          )
                                    }
                                </Box>

                                {/* In the overlay, the task's point on this day, if it has one: which point, and when. */}
                                { medium && pointOfTask(task.id).map(stop =>
                                                                     (
                                                                         <Box key={stop.node.id}
                                                                              component="span"
                                                                              title={`${pointName(stop)} · ${whenOf(stop)}`}
                                                                              sx={{ flexShrink: 0,
                                                                                    pr: 0.5,
                                                                                    fontFamily: MONO,
                                                                                    fontSize: '0.64rem',
                                                                                    color: 'arc.onPaperStrong'
                                                                                 }}>
                                                                             { pointName(stop) } · { whenOf(stop) }
                                                                         </Box>
                                                                     ))
                                }
                            </Box>
                        ))
            }
        </Box>
    )
}

export default DayCardNote

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** "Put on this day · 2 tasks due", "Due — its own deadline", "Put on this day". */
function reasonOf(entry: DayCardEntry): string
{
    const reasons: string[] = []
    if (entry.placed)
        reasons.push('Put on this day')
    if (entry.own.length > 0)
        reasons.push('due — its own dates')
    const dueTasks = new Set(entry.taskPoints.map(stop => stop.task!.id)).size
    if (dueTasks > 0)
        reasons.push(`${dueTasks} ${dueTasks === 1
            ? 'task'
            : 'tasks'} due`)
    const text = reasons.join(' · ')
    return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "15:00–17:00", or "no time". */
function whenOf(stop: Stop): string
{
    return stop.timed
        ? spanLabel(stop.at, stop.duration, stop.relative)
        : 'no time'
}
