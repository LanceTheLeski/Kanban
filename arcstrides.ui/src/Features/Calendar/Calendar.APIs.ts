/**
 * Calendar.APIs.ts
 *
 * HTTP API layer for the calendar.
 *
 * Replaces: ArcStrides.UI.Legacy/Repositories/CalendarRepository.cs, whose one
 * read was FetchMonthAsync — by a month ID the Blazor page had to hard-code,
 * because nothing could look one up.
 *
 * ── A month is addressed by the month, not by an ID ──────────────────────────
 * The calls here name a month the way a person does, year and month, and
 * a day as year, month and day. The API stores a month only as the rows of the
 * days something was put on, sharing an ID it mints with the first of them; the
 * UI never needs that ID, and never has to create a month before using it.
 *
 *   fetchMonthOf        what is stored for a month — often nothing
 *   addCardToDate       put a card on a day, creating the day if need be
 *   removeCardFromDate  take it off again
 *   setDateType         say what kind of day it is — see Calendar.DayTypes
 *
 * Months run 0–11 here, as dayjs counts them, and 1–12 on the wire, as the API
 * takes them. The conversion happens in this file and nowhere else.
 *
 * ── Wire shapes vs domain types ───────────────────────────────────────────────
 * The same arrangement as Board.APIs: the `*Response` interfaces are what the
 * server sends, Calendar.Types holds what the app uses, and the mapping between
 * them is the only place that knows about both. A day's cards are ordinary
 * CardResponses, so they go through the board's mapCard rather than a copy of it.
 */

import { apiClient, ARC } from '../../Lib/Client'
import { mapCard, type CardResponse } from '../Board/Board.APIs'
import { isNewTag, mapTags, type TagResponse } from '../TagGroup/Tag/Tag.APIs'
import type { Tag } from '../../Entities/Tag/Tag.Types'
import type { CalendarDate, Month } from './Calendar.Types'
import type { DayTypeChange, DayTypeOptions, Scene } from './Calendar.DayTypes'

// ── Wire shapes ───────────────────────────────────────────────────────────────

/** Mirrors ArcStrides.Contracts.Response.DateResponse */
interface DateResponse
{
    id: string | null

    dateOrder: number | null

    weekOrder: number | null

    dayOfTheWeekOrder: number | null

    monthName: string | null

    yearOrder: number | null

    dateTypeID: number | null

    cards: CardResponse[] | null

    tags: TagResponse[] | null
}

/** Mirrors ArcStrides.Contracts.Response.MonthResponse */
interface MonthResponse
{
    // Null for a month nothing has been put on: its ID is minted with its first row.
    id: string | null

    title: string | null

    dates: DateResponse[] | null
}

// ── Month ─────────────────────────────────────────────────────────────────────

/**
 * GET arcstrides/calendars/months?year=&month=
 *
 * A month with nothing stored answers 200 with no dates, which is the common
 * case rather than an error.
 */
export async function fetchMonthOf(year: number, month: number): Promise<Month>
{
    const response = await apiClient.get<MonthResponse>(`${ARC}/calendars/months?year=${year}&month=${month + 1}`)
    return mapMonth(response, year, month)
}

/**
 * POST arcstrides/calendars/dates/:year/:month/:day/cards
 *
 * Nothing has to exist first: the server writes the day's row, and the month's
 * ID with it, if this is the first thing on either. Answers with the whole
 * month as it now stands.
 */
export async function addCardToDate(year: number, month: number, day: number, cardId: string): Promise<Month>
{
    const response = await apiClient.post<MonthResponse>(`${datePath(year, month, day)}/cards`, { CardID: cardId })
    return mapMonth(response, year, month)
}

/**
 * DELETE arcstrides/calendars/dates/:year/:month/:day/cards/:cardId
 *
 * The server answers with the month, but apiClient.delete does not read bodies,
 * so the month is read again. One extra GET on a click the user makes by hand.
 */
export async function removeCardFromDate(year: number, month: number, day: number, cardId: string): Promise<Month>
{
    await apiClient.delete(`${datePath(year, month, day)}/cards/${cardId}`)
    return fetchMonthOf(year, month)
}

/**
 * PUT arcstrides/calendars/dates/:year/:month/:day/type
 *
 * Like adding a card, needs nothing to exist first. 0 clears the type.
 */
export async function setDateType(year: number, month: number, day: number, typeId: number): Promise<Month>
{
    const response = await apiClient.put<MonthResponse>(`${datePath(year, month, day)}/type`, { DateTypeID: typeId })
    return mapMonth(response, year, month)
}

/**
 * POST arcstrides/calendars/dates/:year/:month/:day/tags
 *
 * Puts a tag on the day itself: one that exists by its ID, or one by its title,
 * which the server matches to an existing tag before making a new one. Like a
 * card, needs nothing to exist first. Answers with the whole month.
 */
export async function addTagToDate(year: number, month: number, day: number, tag: Tag): Promise<Month>
{
    const response = await apiClient.post<MonthResponse>(`${datePath(year, month, day)}/tags`, {
        ID: isNewTag(tag)
            ? null
            : tag.id,
        Title: tag.title,
    })
    return mapMonth(response, year, month)
}

/**
 * DELETE arcstrides/calendars/dates/:year/:month/:day/tags/:tagId
 *
 * Takes a tag off the day; it stays on anything else. The month is read again,
 * as removeCardFromDate does, because apiClient.delete reads no body.
 */
export async function removeTagFromDate(year: number, month: number, day: number, tagId: string): Promise<Month>
{
    await apiClient.delete(`${datePath(year, month, day)}/tags/${tagId}`)
    return fetchMonthOf(year, month)
}

// ── Options ───────────────────────────────────────────────────────────────────

/** Mirrors ArcStrides.Contracts.Response.DateTypeOptionsResponse */
interface DateTypeOptionsResponse
{
    id: number | null

    scene: string | null

    showsProgress: boolean | null

    defaultTaskTypeID: number | null
}

/** Mirrors ArcStrides.Contracts.Response.CalendarOptionsResponse */
interface CalendarOptionsResponse
{
    weekendDays: number[] | null

    weekendDateTypeID: number | null

    weekdayDateTypeID: number | null

    dateTypes: DateTypeOptionsResponse[] | null
}

/**
 * GET arcstrides/calendars/options
 *
 * With nothing chosen yet the server answers with the defaults: Saturday and
 * Sunday, both of no type, and no type changed.
 */
export async function fetchCalendarOptions(): Promise<DayTypeOptions>
{
    return mapOptions(await apiClient.get<CalendarOptionsResponse>(`${ARC}/calendars/options`))
}

/**
 * PUT arcstrides/calendars/options
 *
 * Whole: what is sent is what is kept, and a type not in `changes` goes back to
 * how it comes. Answers with the options as stored.
 */
export async function saveCalendarOptions(options: DayTypeOptions): Promise<DayTypeOptions>
{
    const response = await apiClient.put<CalendarOptionsResponse>(`${ARC}/calendars/options`, {
        WeekendDays: options.weekendDays,
        WeekendDateTypeID: options.weekendTypeId,
        WeekdayDateTypeID: options.weekdayTypeId,
        DateTypes: Object.entries(options.changes)
                         .map(([id, change]) =>
                         ({
                             ID: Number(id),
                             Scene: change.scene ?? '',
                             ShowsProgress: change.progress,
                             DefaultTaskTypeID: change.defaultTaskTypeId,
                         })),
    })
    return mapOptions(response)
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function mapMonth(response: MonthResponse, year: number, month: number): Month
{
    return {
        id: response.id ?? null,
        year,
        month,
        dates: (response.dates ?? [])
            .map(mapDate)
            .filter(date => date.day > 0)
            .sort((a, b) => a.day - b.day),
    }
}

function datePath(year: number, month: number, day: number): string
{
    return `${ARC}/calendars/dates/${year}/${month + 1}/${day}`
}

function mapDate(response: DateResponse): CalendarDate
{
    return {
        id: response.id ?? '',
        day: response.dateOrder ?? 0,
        month: monthIndex(response.monthName),
        year: response.yearOrder ?? null,
        typeId: response.dateTypeID ?? 0,
        cards: (response.cards ?? []).map(mapCard),
        tags: mapTags(response.tags),
    }
}

/**
 * "January" → 0.
 *
 * The API stores the month as its English name — Date.MonthName, written by
 * whatever created the row — and does not send the MonthOrder it also stores.
 * Matched on the first three letters, so "Jan", "january" and "January " all
 * land on the same month.
 */
function monthIndex(name: string | null): number | null
{
    if (!name)
        return null
    const index = MONTHS.indexOf(name.trim().slice(0, 3).toLowerCase())
    return index === -1
        ? null
        : index
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function mapOptions(response: CalendarOptionsResponse): DayTypeOptions
{
    const changes: Record<number, DayTypeChange> = {}
    for (const type of response.dateTypes ?? [])
    {
        if (type.id == null)
            continue
        changes[type.id] = {
            scene: SCENE_NAMES.find(scene => scene === type.scene) ?? null,
            progress: type.showsProgress ?? true,
            defaultTaskTypeId: type.defaultTaskTypeID ?? null,
        }
    }

    return {
        weekendDays: response.weekendDays ?? [0, 6],
        weekendTypeId: response.weekendDateTypeID ?? 0,
        weekdayTypeId: response.weekdayDateTypeID ?? 0,
        changes,
    }
}

/** The scenes the UI can draw; any other name the server holds is no picture. */
const SCENE_NAMES: Scene[] = ['city', 'park', 'beach']
