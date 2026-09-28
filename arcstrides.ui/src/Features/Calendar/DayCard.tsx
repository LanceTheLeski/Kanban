/**
 * DayCard
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
 * ── Two targets, never nested ────────────────────────────────────────────────
 * The title opens the card; a task opens its popover. The note itself is not a
 * button, because a button holding buttons is two targets that cannot tell
 * which one was meant.
 */

import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { MONO } from '../../Styles/Fonts'
import { UpdateTaskPopover } from '../Board/Task/UpdateTaskPopover'
import { colourOf } from './Calendar.Stats'
import { useCalendarActions } from './Calendar.Context'
import type { Card } from '../../Entities/Card/Card.Types'
import type { Task } from '../../Entities/Task/Task.Types'

interface DayCardProps {
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
}

export const DayCard: React.FC<DayCardProps> = ({ card, tasks, size = 'small', boardCaption }) => {
    const { colours, openCard, taskUpdated } = useCalendarActions()
    const medium = size === 'medium'
    const done = card.tasks.filter(task => task.isCompleted).length
    const total = card.tasks.length

    return (
        <Box className="note"
             sx={{ width: '100%',
                   minWidth: 0,
                   display: 'flex',
                   flexDirection: 'column',
                   gap: medium ? 0.5 : 0.3,
                   p: medium ? 0.75 : 0.4 }}>
            <ButtonBase onClick={() => openCard(card)}
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
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                <Typography component="span"
                            sx={{ fontSize: medium ? '0.8rem' : '0.64rem',
                                  fontWeight: 700,
                                  lineHeight: 1.3,
                                  minWidth: 0,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  overflowWrap: 'anywhere' }}>
                    {card.title || 'Untitled'}
                </Typography>
                {total > 0 && (
                    <Box component="span"
                         sx={{ flexShrink: 0,
                               fontFamily: MONO,
                               fontSize: medium ? '0.7rem' : '0.56rem',
                               color: 'arc.onPaperMuted' }}>
                        {done}/{total}
                    </Box>
                )}
            </ButtonBase>

            {boardCaption && (
                <Typography sx={{ mt: -0.35,
                                  px: 0.25,
                                  fontSize: medium ? '0.62rem' : '0.52rem',
                                  color: 'arc.onPaperMuted' }}>
                    {boardCaption}
                </Typography>
            )}

            {tasks.map(task => (
                <Box key={task.id}
                     className="card-stock-flat paper-green"
                     sx={{ display: 'flex',
                           alignItems: 'center',
                           gap: 0.4,
                           pl: medium ? 0.75 : 0.45,
                           minWidth: 0 }}>
                    {/*
                        The type's mark: the colour its segment has in the ring,
                        so a row can be matched to the graph above it. Named in
                        the tooltip and in the popover, so the colour is never
                        the only way to tell.
                    */}
                    <Box aria-hidden
                         title={task.taskType?.title ?? 'No type'}
                         sx={{ width: medium ? 8 : 6,
                               height: medium ? 8 : 6,
                               borderRadius: '50%',
                               flexShrink: 0,
                               backgroundColor: colourOf(task.taskType?.id, colours) }} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/*
                            Keyed on the values the popover seeds its draft from,
                            as the card editor keys its rows, so a saved change
                            remounts it with the new values.
                        */}
                        <UpdateTaskPopover key={`${task.id}:${task.order}:${task.isCompleted}:${task.title}`}
                                           task={task}
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
                                                        fontSize: medium ? '0.74rem' : '0.6rem',
                                                        lineHeight: 1.3,
                                                        py: medium ? 0.4 : 0.2,
                                                        px: 0.25,
                                                        overflowWrap: 'anywhere' }} />
                    </Box>
                </Box>
            ))}
        </Box>
    )
}

export default DayCard
