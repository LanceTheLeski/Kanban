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
 * The three calls here name a month the way a person does, year and month, and
 * a day as year, month and day. The API stores a month only as the rows of the
 * days something was put on, sharing an ID it mints with the first of them; the
 * UI never needs that ID, and never has to create a month before using it.
 *
 *   fetchMonthOf        what is stored for a month — often nothing
 *   addCardToDate       put a card on a day, creating the day if need be
 *   removeCardFromDate  take it off again
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
import type { CalendarDate, Month } from './Calendar.Types'

// ── Wire shapes ───────────────────────────────────────────────────────────────

/** Mirrors ArcStrides.Contracts.Response.DateResponse */
interface DateResponse {
    id: string | null
    dateOrder: number | null
    weekOrder: number | null
    dayOfTheWeekOrder: number | null
    monthName: string | null
    yearOrder: number | null
    cards: CardResponse[] | null
}

/** Mirrors ArcStrides.Contracts.Response.MonthResponse */
interface MonthResponse {
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
export async function fetchMonthOf(year: number, month: number): Promise<Month> {
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
export async function addCardToDate(year: number, month: number, day: number, cardId: string): Promise<Month> {
    const response = await apiClient.post<MonthResponse>(`${datePath(year, month, day)}/cards`, { CardID: cardId })
    return mapMonth(response, year, month)
}

/**
 * DELETE arcstrides/calendars/dates/:year/:month/:day/cards/:cardId
 *
 * The server answers with the month, but apiClient.delete does not read bodies,
 * so the month is read again. One extra GET on a click the user makes by hand.
 */
export async function removeCardFromDate(year: number, month: number, day: number, cardId: string): Promise<Month> {
    await apiClient.delete(`${datePath(year, month, day)}/cards/${cardId}`)
    return fetchMonthOf(year, month)
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

function mapMonth(response: MonthResponse, year: number, month: number): Month {
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

function datePath(year: number, month: number, day: number): string {
    return `${ARC}/calendars/dates/${year}/${month + 1}/${day}`
}

function mapDate(response: DateResponse): CalendarDate {
    return {
        id: response.id ?? '',
        day: response.dateOrder ?? 0,
        month: monthIndex(response.monthName),
        year: response.yearOrder ?? null,
        cards: (response.cards ?? []).map(mapCard),
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
function monthIndex(name: string | null): number | null {
    if (!name) return null
    const index = MONTHS.indexOf(name.trim().slice(0, 3).toLowerCase())
    return index === -1 ? null : index
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
