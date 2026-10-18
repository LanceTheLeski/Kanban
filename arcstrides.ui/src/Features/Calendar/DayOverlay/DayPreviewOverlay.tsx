/**
 * DayPreviewOverlay
 *
 * The day a timeline point is on, as the calendar's day view draws it, opened
 * from the point — to see how the time fits the day before it is kept.
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ (23) Friday 23 October · Work               [ picture ] │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ Timeline   09:30 Draft · Write the report                │
 *   │            16:30–18:30 Deadline · as in the editor       │
 *   ├────────────────────────────┬─────────────────────────────┤
 *   │ Due — no time              │ Cards                       │
 *   └────────────────────────────┴─────────────────────────────┘
 *
 * The same timeline and the same Due column as the day overlay (DayTimelineList,
 * DayDueList), from every card the calendar can read, with the points being edited
 * drawn in their places on blue — as they stand in the editor, not as last
 * saved, so a time can be tried and looked at before the editor is saved.
 *
 * Read-only. It opens over a card or a task being edited, where opening
 * another card, or changing the day, would leave that edit underneath
 * something else; the calendar is where the day is changed.
 */

import React, { useMemo } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import dayjs, { type Dayjs } from 'dayjs'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcTitleBar } from '../../../Components/ArcTitleBar'
import { SERIF } from '../../../Styles/Fonts'
import { rem } from '../../../Styles/Measures'
import type { NodeValue } from '../../Board/Timeline/Timeline.Nodes'
import { DayTimelineList } from './DayTimelineList'
import { DayDueList } from './DayDueList'
import { DayTypeSceneArt } from '../Assets/DayTypeSceneArt'
import { DateDiscNumber } from '../GridDay/DateDiscNumber'
import { CalendarContext, type CalendarActions } from '../Calendar.Context'
import { useDayTypes } from '../Hooks/useDayTypes'
import { dayOf, type GridDay } from '../Calendar.Grid'
import { isSubjects, stopsOf, stopsOn, uniqueStops, type PendingPoint, type Subject } from '../Calendar.Stops'
import { usePickerMonth } from '../Hooks/usePickerMonth'

interface DayPreviewOverlayProps
{
    date: Dayjs

    /** What is being scheduled, by name: the card's or the task's title. */
    title: string

    /** Its points as they stand in the editor — the ones on this day are drawn. */
    points: { name: string; value: NodeValue }[]

    /** Whose saved points to leave out: they are the ones being edited. */
    subject?: Subject

    /** The board it is on, so its other deadlines are counted. */
    boardId?: string

    onClose: () => void
}

export const DayPreviewOverlay: React.FC<DayPreviewOverlayProps> = ({ date, title, points, subject, boardId, onClose }) =>
{
    const load = usePickerMonth(date, boardId
        ? [boardId]
        : [], true)
    const key = date.format('YYYY-MM-DD')
    const day: GridDay = dayOf(load.weeks, key) ?? { key, date, stored: null, isToday: date.isSame(dayjs(), 'day') }
    const type = useDayTypes().typeOf(day.date, day.stored?.typeId)

    // The day overlay's two lists, from the same cards, without the subject's saved points.
    const placedIds = new Set((day.stored?.cards ?? []).map(card => card.id))
    const placed = load.cards.filter(card => placedIds.has(card.id))
    const today = stopsOn(load.cards, date).filter(stop => !isSubjects(stop, subject))
    const railStops = uniqueStops([
        ...stopsOf(placed).filter(stop => !isSubjects(stop, subject) && (stop.timed || !stop.at.isSame(date, 'day'))),
        ...today.filter(stop => stop.timed),
    ])
    const due = today.filter(stop => !stop.timed)

    const pending: PendingPoint[] = points.flatMap(({ name, value }) => (value.date?.isSame(date, 'day')
        ? [{
            key: name,
            name,
            title,
            at: value.time
                ? date.hour(value.time.hour()).minute(value.time.minute())
                : date,
            timed: value.time !== null,
            duration: value.duration,
        }]
        : []))

    // The lists ask the calendar for colours and names; nothing in a preview opens.
    const actions = useMemo<CalendarActions>(() =>
    ({
        colours: load.colours,
        boardTitle: () => null,
        openCard: nothing,
        openDay: nothing,
        taskUpdated: nothing,
        setDayType: nothing,
        setDayTags: nothing,
        goToDay: nothing,
        knownCards: load.cards,
        stopsOnDay: () => [],
        readingBoards: load.loading,
    }), [load.colours, load.cards, load.loading])

    return (
        <CalendarContext.Provider value={actions}>
            <ArcOverlay open
                        onClose={onClose}
                        discardLabel="Close"
                        width={PREVIEW_WIDTH}
                        title="The whole day"
                        titleCaption={`${title} as it stands in the editor — nothing here is saved or changed`}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Box className={`card-disc card-stock${day.isToday
                                 ? ' paper-oxblood'
                                 : ''}`}
                             aria-hidden
                             sx={{ width: DISC,
                                   height: DISC,
                                   flexShrink: 0,
                                   display: 'grid',
                                   placeItems: 'center'
                                }}>
                            <DateDiscNumber value={date.date()}
                                            disc={DISC} />
                        </Box>
                        <Box component="h2"
                             sx={{ m: 0,
                                   flex: '1 1 12rem',
                                   color: 'arc.onGlass',
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)'
                                }}>
                            <Box component="span"
                                 sx={{ display: 'block',
                                       fontFamily: SERIF,
                                       fontSize: '1.4rem',
                                       fontWeight: 400,
                                       lineHeight: 1.1
                                    }}>
                                { date.format('dddd D MMMM') }
                            </Box>
                            <Box component="span"
                                 sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 400 }}>
                                { type.scene
                                    ? `${type.name} · ${type.blurb}`
                                    : date.format('YYYY')
                                }
                            </Box>
                        </Box>
                        { type.scene && (
                            <Box className="card-stock tile"
                                 sx={{ width: 120, height: 60, overflow: 'hidden', flexShrink: 0 }}>
                                <DayTypeSceneArt scene={type.scene} />
                            </Box>
                        )
                        }
                    </Box>

                    <Paper className="card-stock paper-yellow"
                           elevation={0}
                           sx={{ minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <ArcTitleBar stock="sage">Timeline</ArcTitleBar>
                        { railStops.length === 0 && pending.every(point => !point.timed)
                            ? (
                                  <Typography sx={{ fontSize: '0.75rem',
                                                    color: 'arc.onPaperMuted',
                                                    px: 0.5
                                                 }}>
                                      { load.loading
                                          ? 'Reading the day…'
                                          : 'Nothing has a time on this day.'
                                      }
                                  </Typography>
                              )
                            : <DayTimelineList day={day}
                                               stops={railStops}
                                               pending={pending.filter(point => point.timed)}
                                               readOnly />
                        }
                    </Paper>

                    <Paper className="card-stock paper-blue"
                           elevation={0}
                           sx={{ minWidth: 0,
                                 p: 1.5,
                                 display: 'grid',
                                 gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) minmax(0, 1fr)' },
                                 gap: 1.5,
                                 alignItems: 'start'
                              }}>
                        <Box className="card-stock-flat card-cut paper-yellow"
                             sx={{ minWidth: 0,
                                   alignSelf: 'stretch',
                                   p: 1,
                                   display: 'flex',
                                   flexDirection: 'column',
                                   gap: 1
                                }}>
                            <ArcTitleBar caption="No time of day">Due</ArcTitleBar>
                            <DayDueList stops={due}
                                        pending={pending.filter(point => !point.timed)}
                                        readOnly />
                        </Box>
                        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <ArcTitleBar>Cards</ArcTitleBar>
                            { placed.length === 0 && (
                                <Typography sx={{ fontSize: '0.75rem', color: 'arc.onPaperMuted', px: 0.5 }}>
                                    { type.emptyNote }
                                </Typography>
                            )
                            }
                            { placed.map(card =>
                                         (
                                             <Box key={card.id}
                                                  className="note"
                                                  sx={{ px: 1, py: 0.75 }}>
                                                 <Typography sx={{ fontSize: '0.8rem',
                                                                   fontWeight: 700,
                                                                   color: 'arc.onPaperStrong'
                                                                }}>
                                                     { card.title }
                                                 </Typography>
                                                 <Typography sx={{ fontSize: '0.66rem',
                                                                   color: 'arc.onPaperMuted'
                                                                }}>
                                                     { card.tasks.length === 0
                                                         ? 'No tasks'
                                                         : `${card.tasks.filter(task => task.isCompleted).length} of ${card.tasks.length} tasks done`
                                                     }
                                                 </Typography>
                                             </Box>
                                         ))
                            }
                        </Box>
                    </Paper>
                </Box>
            </ArcOverlay>
        </CalendarContext.Provider>
    )
}

export default DayPreviewOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const nothing = () => undefined

const PREVIEW_WIDTH = rem(860)

const DISC = 64
