/**
 * DayCell
 *
 * One day of the month: its number, and the cards on it.
 *
 * Mirrors: Layouts/Calendar/CalendarDate.razor, less what never worked there —
 *
 *   · the donut and line charts. Both were fed arrays marked `//todo` and drew
 *     empty rings on every day of the month.
 *   · the settings icon, which had no click handler.
 *   · the boards carousel, with its left and right arrows and ALL toggle. The
 *     arrow handlers assigned to a copy of the index and so never moved it, and
 *     ALL only toggled auto-cycling, so what a day showed changed on a timer.
 *     A day now shows its first few cards and says how many more there are.
 *
 * The expand icon became the day's number. It opened the day overlay, and the
 * number is the part of a day you are looking at when you want to open it.
 */

import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { NUMERALS } from '../../Styles/Fonts'
import { CalendarNote } from './CalendarNote'
import { DAY_MIN_HEIGHT, NOTES_FROM, NOTES_PER_DAY } from './Calendar.Layout'
import type { Card } from '../../Entities/Card/Card.Types'
import type { GridDay } from './Calendar.Grid'

interface DayCellProps {
    day: GridDay
    onOpenDay: () => void
    onOpenCard: (card: Card) => void
}

export const DayCell: React.FC<DayCellProps> = ({ day, onOpenDay, onOpenCard }) => {
    const cards = day.stored?.cards ?? []
    const shown = cards.slice(0, NOTES_PER_DAY)
    const hidden = cards.length - shown.length
    const name = day.date.format('dddd D MMMM')

    return (
        <Box sx={{ minWidth: 0,
                   minHeight: DAY_MIN_HEIGHT,
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'stretch',
                   gap: 0.5,
                   p: { xs: 0.4, [NOTES_FROM]: 0.6 },
                   // Above the weekday glass, so the notes are not frosted —
                   // the same stacking as a board cell.
                   position: 'relative',
                   zIndex: 2 }}>
            {/*
                The number, punched out of card and glued down: a disc, like the
                days in the date pickers and the points on a task's timeline,
                so a date looks like the same thing wherever the app shows one.
                Today is cut from the ink stock the pickers mark today with.

                The disc is the button, and only the disc — a day's hit area is
                the thing you can see, not the whole box around it.
            */}
            <ButtonBase className={`card-disc card-stock-flat${day.isToday ? ' paper-ink' : ''}`}
                        onClick={onOpenDay}
                        aria-label={`Open ${name}${day.isToday ? ', today' : ''}`}
                        aria-current={day.isToday ? 'date' : undefined}
                        sx={{ alignSelf: 'flex-start',
                              flexShrink: 0,
                              width: { xs: '1.45rem', [NOTES_FROM]: '1.75rem' },
                              height: { xs: '1.45rem', [NOTES_FROM]: '1.75rem' },
                              '&:hover': { filter: 'brightness(0.96)' },
                              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'arc.paperAccent', outlineOffset: 1 } }}>
                <Typography component="span"
                            sx={{ fontFamily: NUMERALS,
                                  fontWeight: 700,
                                  fontSize: { xs: '0.78rem', [NOTES_FROM]: '0.95rem' },
                                  lineHeight: 1,
                                  color: 'arc.onPaperStrong' }}>
                    {day.date.date()}
                </Typography>
            </ButtonBase>

            {/* Wide enough for titles: the first few notes, then a count of the rest. */}
            {cards.length > 0 && (
                <Box sx={{ display: { xs: 'none', [NOTES_FROM]: 'flex' },
                           flexDirection: 'column',
                           gap: 0.5,
                           minWidth: 0 }}>
                    {shown.map(card => (
                        <CalendarNote key={card.id} card={card} onOpen={() => onOpenCard(card)} />
                    ))}

                    {hidden > 0 && (
                        <ButtonBase onClick={onOpenDay}
                                    sx={{ alignSelf: 'flex-start',
                                          px: 0.5,
                                          borderRadius: '2px',
                                          fontSize: '0.62rem',
                                          fontWeight: 600,
                                          color: 'arc.onPaper',
                                          '&:hover': { backgroundColor: 'arc.paperHover' } }}>
                            + {hidden} more
                        </ButtonBase>
                    )}
                </Box>
            )}

            {/*
                Too narrow for a title: one small note with the count on it, so
                a phone still shows which days have something on them. It opens
                the day, where the cards have room to be read.
            */}
            {cards.length > 0 && (
                <ButtonBase className="note"
                            onClick={onOpenDay}
                            aria-label={`${cards.length} ${cards.length === 1 ? 'card' : 'cards'} on ${name}`}
                            sx={{ display: { xs: 'inline-flex', [NOTES_FROM]: 'none' },
                                  alignSelf: 'flex-start',
                                  minWidth: '1.2rem',
                                  px: 0.4,
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  lineHeight: 1.6 }}>
                    {cards.length}
                </ButtonBase>
            )}
        </Box>
    )
}

export default DayCell
