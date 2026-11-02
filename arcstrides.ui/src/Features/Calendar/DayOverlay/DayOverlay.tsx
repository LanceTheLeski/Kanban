/**
 * DayOverlay
 *
 * One day, opened up.
 *
 *   ┌─────────────────────────────────────────────────┬──────────────┐
 *   │ (30) [ picture ]  Tuesday 30 September   [tags] │  the day, as │
 *   ├─────────────────────────────────────────────────┤  on the grid │
 *   │ Timeline — everything with a time, by card      │  Progress    │
 *   ├─────────────────────────────────────────────────┤  Connections │
 *   │ Cards — put on the day or due on it, with their │              │
 *   │ tasks under them; + Add card                    │              │
 *   └─────────────────────────────────────────────────┴──────────────┘
 *
 * Mirrors: Layouts/Calendar/UpdateDateOverlay.razor, which was laid out the
 * same way round — flex-row-reverse, the CalendarDate and its card titles in a
 * column on the right, and on the left a header row (the date, the type, the
 * swatch, the tags) over the timeline. Here:
 *
 *   the header row                   → DayHeaderPanel: the number, the theme's
 *                                      picture (click it to change the theme),
 *                                      the date in words, the tags
 *   the timeline by end deadline     → the timeline, every point with a time
 *   the card titles                  → Cards, under it: every card put on the
 *                                      day or due on it, with its tasks
 *   `<CalendarDate>` in the column   → the live copy, top right, on glass, at
 *                                      exactly the size the grid draws it
 *   the second, placeholder timeline → Connections: nearby days, boards,
 *                                      other days
 *
 * ── Whose deadlines ──────────────────────────────────────────────────────────
 * A task is due on a day whether or not its card was put on the day, so the
 * timeline and the cards are found among every card the calendar can read: the
 * day's own, and those on the boards it knows (useCalendarBoards,
 * Calendar.Stops). The timeline has the day's cards' whole schedules, other days
 * included, and anything with a time today. Cards has every card put on the day
 * or due on it, each once, and a task due today is always under its card —
 * never on its own (DayCardsPanel).
 *
 * The right-hand column is slim and frosted, the grid's own material, because
 * what is in it is the day as the calendar sees it and the ways out of it.
 *
 * ── Everything waits for Save ────────────────────────────────────────────────
 * The day's type, its tags, the cards put on it or taken off, and the tasks
 * edited from its notes are a draft until Save (useDayDraft); Discard drops it.
 * Save shows only while the draft holds something, as in every overlay.
 * The overlay — the live copy on the right included — draws the day as it will
 * be, through a calendar context of its own that changes the draft where the
 * month's would write. Moving to another day with changes waiting asks for
 * Save or Discard first. A card opened from here has its own Save.
 *
 * ── What the day's type changes ──────────────────────────────────────────────
 * A day that measures progress (see Calendar.DayTypes) gets the table of types
 * with done and total; Leisure gets what is on, by type, without the done; a
 * vacation gets neither, and if anything is on it, says so beside the offer to
 * move it. Empty panels are not drawn: a day with no timeline has no Timeline
 * panel, rather than one saying there is nothing in it.
 */

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { ArcOverlay } from '../../../Components/ArcOverlay'
import { ArcTitleBar } from '../../../Components/ArcTitleBar'
import { MONO } from '../../../Styles/Fonts'
import { rem } from '../../../Styles/Measures'
import { DayHeaderPanel } from './DayHeaderPanel'
import { GridDayCell } from '../GridDay/GridDayCell'
import { DayTimelineList } from './DayTimelineList'
import { DayConnectionsPanel } from './DayConnectionsPanel'
import { AddCardPicker } from './AddCardPicker'
import { dayStats, type DayStats } from '../Calendar.Stats'
import { useDayTypes } from '../Hooks/useDayTypes'
import { cardsOnDay, stopsOf, stopsOn, uniqueStops } from '../Calendar.Stops'
import { DayCardsPanel } from './DayCardsPanel'
import { boardLabel } from '../Calendar.Views'
import { CalendarContext, useCalendarActions, type CalendarActions } from '../Calendar.Context'
import { useGridDaySize } from '../Hooks/useGridDaySize'
import { useDayDraft } from '../Hooks/useDayDraft'
import { StagedCardsContext } from '../Calendar.StagedCards'
import { useArcError } from '../../../Components/useArcError'
import type { GridDay } from '../Calendar.Grid'

interface DayOverlayProps
{
    day: GridDay

    onClose: () => void

    /** Boards whose cards "+ Add card" offers — see useAddableCards. */
    boardIds: string[]

    /** Opened from "Add a card…": the search is already open. */
    startAdding?: boolean

    /**
     * Bumped each time "Add a card…" is chosen, including from the live copy's
     * own ⋮ while the overlay is already open, so the search opens again.
     */
    addRequest?: number
}

export const DayOverlay: React.FC<DayOverlayProps> = ({
    day: storedDay,
    onClose,
    boardIds,
    startAdding = false,
    addRequest = 0,
}) =>
{
    const month = useCalendarActions()
    const { addError } = useArcError()

    // The day as it will be after Save, and the calendar's cards likewise — see the header.
    const draft = useDayDraft(storedDay, month.knownCards, addError)
    const { day, knownCards } = draft
    const today = stopsOn(knownCards, day.date)
    const actions: CalendarActions =
    {
        ...month,
        setDayType: (target, typeId) => (target.key === day.key
            ? draft.setType(typeId)
            : month.setDayType(target, typeId)),
        setDayTags: (target, tags) => (target.key === day.key
            ? draft.setTags(tags)
            : month.setDayTags(target, tags)),
        stageTask: draft.stageTask,
        knownCards,
        stopsOnDay: key => (key === day.key
            ? today
            : month.stopsOnDay(key)),
        goToDay: date => (draft.dirty
            ? addError(`${day.date.format('D MMMM')} has changes waiting: save or discard them before moving to another day.`)
            : month.goToDay(date)),
    }

    const { colours, boardTitle, readingBoards } = actions
    const cards = day.stored?.cards ?? []
    const stats = dayStats(cards, colours)
    const type = useDayTypes().typeOf(day.date, day.stored?.typeId)
    const gridDay = useGridDaySize(day.key)
    const manyBoards = new Set(cards.map(card => card.boardId)).size > 1

    // Every card the calendar can read, and every point on this day — read with
    // the month, by MonthView (see Calendar.Context), with the draft folded in.
    const onDay = new Set(cards.map(card => card.id))
    const placed = knownCards.filter(card => onDay.has(card.id))
    const railStops = uniqueStops([
        ...stopsOf(placed).filter(stop => stop.timed || !stop.at.isSame(day.date, 'day')),
        ...today.filter(stop => stop.timed),
    ])
    // Every card on the day — put on it, or due on it — each once, with what of it falls today.
    const entries = cardsOnDay(placed, today)

    const handleSave = async () =>
    {
        if (await draft.save())
            onClose()
    }

    return (
        <CalendarContext.Provider value={actions}>
        {/* The day's cards as the draft holds them, for the date pickers of the tasks edited here. */}
        <StagedCardsContext.Provider value={knownCards}>
        <ArcOverlay open
                    onClose={onClose}
                    onSubmit={handleSave}
                    dirty={draft.dirty}
                    width={DAY_OVERLAY_WIDTH}>
            <Box sx={{ display: 'grid',
                       gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) auto' },
                       gridTemplateAreas: { xs: '"band" "main" "side"', md: '"band side" "main side"' },
                       gridTemplateRows: { md: 'auto 1fr' },
                       alignItems: 'start',
                       columnGap: 2,
                       rowGap: 2
                    }}>
                <Box sx={{ gridArea: 'band', minWidth: 0 }}>
                    <DayHeaderPanel day={day} />
                </Box>

                <Box sx={{ gridArea: 'main', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/*
                        The timeline on yellow, the stock the task timeline panel
                        cuts its Deadline tab from, on the same gold rail its
                        points sit on.
                    */}
                    { railStops.length > 0 && (
                        <Paper className="card-stock paper-yellow"
                               elevation={0}
                               sx={{ minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/*
                                Sage — the green ladder's mid, which nothing else
                                in the day view is cut from: a label of its own
                                colour for the panel that is the bulk of the day,
                                cool against the yellow it sits on and the gold
                                of the rail under it.
                            */}
                            <ArcTitleBar stock="sage">Timeline</ArcTitleBar>
                            <DayTimelineList day={day}
                                             stops={railStops} />
                        </Paper>
                    )
                    }

                    {/*
                        The day's cards, on a sheet of blue — the way the tags
                        panel puts its pieces on blue: the ones put on the day,
                        and the ones due on it, each once, with their tasks under
                        them. See DayCardsPanel.
                    */}
                    <Paper className="card-stock paper-blue"
                           elevation={0}
                           sx={{ minWidth: 0, p: 1.5 }}>
                        <DayCardsPanel entries={entries}
                                       emptyNote={type.emptyNote}
                                       busyNote={type.busyNote}
                                       reading={readingBoards}
                                       boardCaptionOf={card => (manyBoards
                                           ? boardTitle(card.boardId) || boardLabel(card.boardId)
                                           : undefined)}
                                       onRemoveCard={draft.removeCard}>
                            <AddCardPicker key={addRequest}
                                           boardIds={boardIds}
                                           onDay={onDay}
                                           onPick={draft.addCard}
                                           startOpen={startAdding} />
                        </DayCardsPanel>
                    </Paper>

                    { draft.dirty && (
                        <Typography role="status"
                                    sx={{ fontSize: '0.74rem', color: 'arc.onGlass', textAlign: 'right' }}>
                            { draft.pending === 1
                                ? 'One change waits for Save.'
                                : `${draft.pending} changes wait for Save.`
                            }
                        </Typography>
                    )
                    }
                </Box>

                {/*
                    The slim column, on glass: the day as the calendar shows it
                    — live, so stepping ‹ › here steps it on the grid too — its
                    numbers, and where it leads.
                */}
                <Box className="day-glass"
                     sx={{ gridArea: 'side',
                           // As slim as the column can be, and never narrower
                           // than the grid's day plus the padding round it.
                           width: { md: gridDay
                                        ? `max(${SIDE_WIDTH}, ${gridDay.width + SIDE_PADDING * 2}px)`
                                        : SIDE_WIDTH },
                           minWidth: 0,
                           p: 1,
                           display: 'flex',
                           flexDirection: 'column',
                           gap: 1.5,
                           alignSelf: 'stretch'
                        }}>
                    {/*
                        The day exactly as the calendar draws it: the grid day's
                        own width and height, so its layout is the grid's too.
                    */}
                    <Box sx={{ width: gridDay?.width ?? '100%',
                               height: gridDay?.height,
                               maxWidth: '100%',
                               flexShrink: 0,
                               alignSelf: 'center',
                               display: 'flex'
                            }}>
                        <GridDayCell day={day}
                                     mini />
                    </Box>
                    { (type.progress || type.ring) && stats.total > 0 && <TypesTable stats={stats}
                                                                                     progress={type.progress} />
                    }
                    <DayConnectionsPanel day={day} />
                </Box>
            </Box>
        </ArcOverlay>
        </StagedCardsContext.Provider>
        </CalendarContext.Provider>
    )
}

export default DayOverlay

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const DAY_OVERLAY_WIDTH = rem(1120)

/** The slim column: a day on a desktop grid, and a little, so it looks as it will there. */
const SIDE_WIDTH = rem(236)

/** The side column's padding, in px — p: 1. */
const SIDE_PADDING = 8

/**
 * Every type on the day by name, with its mark and its count — and, on a day
 * that measures progress, its done and its share. What lets the ring's and the
 * lines' colours be only a link, never the only way to tell types apart.
 */
function TypesTable({ stats, progress }: { stats: DayStats; progress: boolean })
{
    const headings = progress
        ? ['Type', 'Done', 'Of', '']
        : ['Type', 'Tasks']

    return (
        <Paper className="card-stock"
               elevation={0}
               sx={{ minWidth: 0, p: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <ArcTitleBar>{ progress
                ? `Progress · ${stats.done} of ${stats.total}`
                : 'What is on'
                         }</ArcTitleBar>

            <Box component="table"
                 aria-label="Tasks by type"
                 sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { py: 0.2, px: 0.4 } }}>
                <Box component="thead">
                    <Box component="tr">
                        { headings.map(heading =>
                                       (
                                           <Box component="th"
                                                key={heading}
                                                sx={{ textAlign: heading === 'Type'
                                                          ? 'left'
                                                          : 'right',
                                                      fontSize: '0.58rem',
                                                      fontWeight: 700,
                                                      letterSpacing: '0.06em',
                                                      textTransform: 'uppercase',
                                                      color: 'arc.onPaperMuted'
                                                   }}>
                                               { heading }
                                           </Box>
                                       ))
                        }
                    </Box>
                </Box>
                <Box component="tbody">
                    { stats.slices.map(slice =>
                                       (
                                           <Box component="tr"
                                                key={slice.key}>
                                               <Box component="td"
                                                    sx={{ fontSize: '0.72rem', color: 'arc.onPaperStrong' }}>
                                                   <Box component="span"
                                                        aria-hidden
                                                        sx={{ display: 'inline-block',
                                                              width: 9,
                                                              height: 9,
                                                              mr: 0.6,
                                                              borderRadius: '2px',
                                                              verticalAlign: '-1px',
                                                              backgroundColor: slice.colour
                                                           }} />
                                                   { slice.title }
                                               </Box>
                                               { progress && <Box component="td"
                                                                  sx={NUMBER_CELL}>{ slice.done }</Box>
                                               }
                                               <Box component="td"
                                                    sx={NUMBER_CELL}>{ slice.count }</Box>
                                               { progress && (
                                                   <Box component="td"
                                                        sx={{ ...NUMBER_CELL, color: 'arc.onPaperMuted' }}>
                                                       { Math.round((slice.done / slice.count) * 100) }%
                                                   </Box>
                                               )
                                               }
                                           </Box>
                                       ))
                    }
                </Box>
            </Box>
        </Paper>
    )
}

const NUMBER_CELL =
{
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: '0.66rem',
    fontVariantNumeric: 'tabular-nums',
    color: 'arc.onPaper',
} as const
