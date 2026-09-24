/**
 * Calendar.APIs.ts
 *
 * HTTP API layer for the calendar.
 *
 * Replaces: ArcStrides.UI.Legacy/Repositories/CalendarRepository.cs, whose one
 * read was FetchMonthAsync. The API's other calendar endpoints — create a month,
 * create, patch and delete a date — have no caller in the UI yet, and two of
 * them answer 418 (see docs/api-gaps.md), so they are not wrapped here until a
 * screen needs them.
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
    // Declared by the contract, never set by CalendarController.FetchMonth —
    // which is why Month takes its ID from the request instead.
    id: string | null
    title: string | null
    dates: DateResponse[] | null
}

// ── Month ─────────────────────────────────────────────────────────────────────

/**
 * GET arcstrides/calendars/months/:monthId
 *
 * A month the API has no rows for is not an error: FetchMonth answers 200 with
 * no dates. The page says so rather than drawing a grid for a month it would
 * have to guess.
 */
export async function fetchMonth(monthId: string): Promise<Month> {
    const response = await apiClient.get<MonthResponse>(`${ARC}/calendars/months/${monthId}`)

    return {
        id: response.id ?? monthId,
        dates: (response.dates ?? [])
            .map(mapDate)
            .filter(date => date.day > 0)
            .sort((a, b) => a.day - b.day),
    }
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

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
