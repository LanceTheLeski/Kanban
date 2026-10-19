/**
 * MonthView
 *
 * The month grid, and the two things that open from it: a day, and a card.
 *
 * The grid is drawn from `year` and `month` alone, so it is on screen before
 * the API has answered; whatever is stored for the month is laid over it from
 * the store when it arrives. See Calendar.Store.
 *
 * Which day or card is open is held here rather than in each day, because both
 * can be opened from two places — a card from its note on the grid or from the
 * day overlay, a day from its number or from its "+ n more" — and there is one
 * of each on screen at a time. The Blazor calendar mounted a card overlay and a
 * day overlay inside every one of its 35 days to get the same effect.
 *
 * A day is held by its key, not as the object, so an open day follows the
 * month as it changes under it: a card added, a card taken off, a re-read after
 * an edit.
 *
 * Every day reaches these — and the type colours, and the board names — through
 * CalendarContext rather than props; see Calendar.Context for why.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useArcError } from '../../../Components/useArcError'
import { DEFAULT_BOARD_ID } from '../../Board/Board.Defaults'
import { MonthGrid } from './MonthGrid'
import { DayOverlay } from '../DayOverlay/DayOverlay'
import { CalendarCardOverlay } from './CalendarCardOverlay'
import { DefaultTaskTypeContext } from '../../Board/Task/Task.Defaults'
import { useDayTypes } from '../Hooks/useDayTypes'
import { useCalendarStore } from '../Calendar.Store'
import { dayOf, monthPath, weeksOf } from '../Calendar.Grid'
import { typeColours } from '../Calendar.Stats'
import { dayTypeOf } from '../Calendar.DayTypes'
import { CalendarContext, type CalendarActions } from '../Calendar.Context'
import { useBoardTitles } from '../Hooks/useBoardTitles'
import { useCalendarBoards } from '../Hooks/useCalendarBoards'
import { stopsOf, uniqueCards, type Stop } from '../Calendar.Stops'
import type { Card } from '../../../Entities/Card/Card.Types'

interface MonthViewProps
{
    year: number
    /** From 0, as dayjs counts. */
    month: number
}

export const MonthView: React.FC<MonthViewProps> = ({ year, month }) =>
{
    const stored = useCalendarStore(state => state.stored)
    const taskTypes = useCalendarStore(state => state.taskTypes)
    const refresh = useCalendarStore(state => state.refresh)
    const setDayType = useCalendarStore(state => state.setDayType)
    const setDayTags = useCalendarStore(state => state.setDayTags)
    const { typeOf } = useDayTypes()
    const { addError } = useArcError()
    const navigate = useNavigate()

    // `request` counts "Add a card…" choices, so choosing it again — from the
    // live copy's ⋮ inside the overlay — opens the search again.
    const [opened, setOpened] = useState<{ key: string; adding: boolean; request: number } | null>(null)
    const [openCard, setOpenCard] = useState<Card | null>(null)

    const weeks = useMemo(() => weeksOf(dayjs(new Date(year, month, 1)), stored?.dates ?? []),
                          [year, month, stored])
    const openDay = opened
        ? dayOf(weeks, opened.key)
        : null

    // The boards the calendar knows: "+ Add card" offers their cards, and a day's
    // deadlines are found among them. See useCalendarBoards for why this is a guess, and
    // what would replace it.
    const boardIds = useMemo(() =>
    [
        DEFAULT_BOARD_ID,
        ...(stored?.dates ?? []).flatMap(date => date.cards.map(card => card.boardId)),
    ], [stored])

    const colours = useMemo(() => typeColours(taskTypes), [taskTypes])
    const boardTitle = useBoardTitles(boardIds)

    // Every card the calendar can read, and every point on each day: a task or a
    // card is due on a day whether or not it was put on it. Read with the month,
    // and again on each re-read of it, so an edit made from here shows here.
    const revision = useCalendarStore(state => state.revision)
    const { boards, loading: readingBoards } = useCalendarBoards(boardIds, true, revision)
    const knownCards = useMemo(() => uniqueCards((stored?.dates ?? []).flatMap(date => date.cards),
                                                 boards.flatMap(board => board.cards)), [stored, boards])
    const stopsByDay = useMemo(() =>
    {
        const byDay = new Map<string, Stop[]>()
        for (const stop of stopsOf(knownCards))
        {
            const key = stop.at.format('YYYY-MM-DD')
            byDay.set(key, [...(byDay.get(key) ?? []), stop])
        }
        return byDay
    }, [knownCards])

    const handleOpenCard = useCallback((card: Card) =>
    {
        // The editor saves against the card's board. Without one there is
        // nowhere for a save to go, so say so rather than open a form that
        // cannot keep what is typed into it.
        if (!card.boardId)
        {
            addError(`"${card.title}" did not say which board it is on, so it cannot be opened here.`)
            return
        }
        setOpenCard(card)
    }, [addError])

    const actions = useMemo<CalendarActions>(() =>
    ({
        colours,
        boardTitle,
        openCard: handleOpenCard,
        openDay: (day, options) => setOpened(previous =>
        ({
            key: day.key,
            adding: options?.adding === true,
            request: (previous?.request ?? 0) + (options?.adding
                ? 1
                : 0),
        })),
        taskUpdated: () => { refresh() },
        setDayType: (day, typeId) =>
        {
            setDayType(day.date.date(), typeId).catch(error =>
            {
                addError(`Could not make ${day.date.format('D MMMM')} ${typeId
                    ? `a ${dayTypeOf(typeId).name} day`
                    : 'follow the week'}: ${messageOf(error)}`)
            })
        },
        setDayTags: (day, tags) =>
        {
            setDayTags(day.date.date(), tags).catch(error =>
            {
                addError(`Could not change the tags on ${day.date.format('D MMMM')}: ${messageOf(error)}`)
            })
        },
        goToDay: date =>
        {
            // The open day is held by key, so it is found again once the
            // other month is drawn — this component stays mounted across it.
            setOpened(previous => ({ key: date.format('YYYY-MM-DD'), adding: false, request: previous?.request ?? 0 }))
            if (date.year() !== year || date.month() !== month)
                navigate(monthPath(date))
        },
        knownCards,
        stopsOnDay: key => stopsByDay.get(key) ?? NO_STOPS,
        readingBoards,
    }), [colours, boardTitle, handleOpenCard, refresh, setDayType, setDayTags, year, month, navigate, addError, knownCards, stopsByDay, readingBoards])

    const handleCloseCard = () =>
    {
        setOpenCard(null)
        refresh()
    }

    return (
        <CalendarContext.Provider value={actions}>
            <MonthGrid weeks={weeks} />

            {
                openDay && (<DayOverlay day={openDay}
                                        boardIds={boardIds}
                                        startAdding={opened?.adding ?? false}
                                        addRequest={opened?.request ?? 0}
                                        onClose={() => setOpened(null)} />)
            }

            {/* After the day, so a card opened from a day stacks above it. */}

            {/*
                Opened over a day, a card's new tasks start as that kind of day
                says — see Task.Defaults. Opened from the grid, as nothing.
            */}
            <DefaultTaskTypeContext.Provider value={openDay
                                                 ? typeOf(openDay.date, openDay.stored?.typeId).defaultTaskTypeId
                                                 : null}>
                { openCard && <CalendarCardOverlay card={openCard} onClose={handleCloseCard} /> }
            </DefaultTaskTypeContext.Provider>
        </CalendarContext.Provider>
    )
}

export default MonthView

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function messageOf(error: unknown): string
{
    return error instanceof Error
        ? error.message
        : String(error)
}

/** One empty list for every day with nothing on it, so a day's memo over it holds. */
const NO_STOPS: Stop[] = []
