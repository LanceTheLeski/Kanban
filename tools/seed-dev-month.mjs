/**
 * Puts the seeded board's cards on a few days of a month, so the calendar has
 * something to show.
 *
 * The calendar does not need this to work: it draws any month from the date
 * alone, and a day is only stored once something is put on it. This is demo
 * data, the way seed-dev-board.mjs is. Run it after that script. See
 * docs/local-development.md.
 *
 *   node tools/seed-dev-month.mjs                    # this month
 *   node tools/seed-dev-month.mjs --month 2025-01    # a particular one
 *   node tools/seed-dev-month.mjs --url http://localhost:5100
 *
 * Declines to touch a month that already has cards on it, so running it twice
 * does not pile the same cards up again.
 *
 * It goes through the HTTP API, like the board seeder: each card is one
 * POST arcstrides/calendars/dates/{year}/{month}/{day}/cards, the same call the
 * calendar's "+ Add card" makes, and the server writes whatever rows that needs.
 * Each card goes on one day only.
 */

import { connectToApi } from './dev-api.mjs'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
    const index = args.indexOf(`--${name}`)
    return index === -1 ? fallback : args[index + 1]
}

// The board the UI opens by default — see arcstrides.ui/src/Features/Board/Board.Defaults.ts.
const BOARD_ID = flag('board', '1cb0ce6e-6145-4fe7-833a-0b7c0545c449')

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

// Where the board's cards land, in days from today (or from the 15th, for a
// month that is not this one). The same offset more than once makes a busy day.
const OFFSETS = [0, 2, -3, 6, 6, 6, 9, -8, 12, -12]

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
    const { year, month } = targetMonth(flag('month', null))
    const daysInMonth = new Date(year, month, 0).getDate()
    const label = `${MONTH_NAMES[month - 1]} ${year}`
    const monthPath = `/arcstrides/calendars/months?year=${year}&month=${month}`

    const { base, get, post } = await connectToApi({ url: flag('url', null), probe: monthPath })
    console.log(`Putting cards on ${label} at ${base}\n`)

    const existing = (await get(monthPath)).dates ?? []
    if (existing.some(date => (date.cards ?? []).length > 0)) {
        console.log(`${label} already has cards on it. Nothing to do.`)
        return summary(get, monthPath, label)
    }

    const cards = (await get(`/arcstrides/boards/${BOARD_ID}`))?.cards ?? []
    if (cards.length === 0) {
        console.log(`Board ${BOARD_ID} has no cards. Run seed-dev-board.mjs first.`)
        return
    }

    const today = new Date()
    const thisMonth = today.getFullYear() === year && today.getMonth() + 1 === month
    const anchor = thisMonth ? today.getDate() : 15

    for (const [index, card] of cards.slice(0, OFFSETS.length).entries()) {
        const day = Math.min(Math.max(anchor + OFFSETS[index], 1), daysInMonth)
        await post(`/arcstrides/calendars/dates/${year}/${month}/${day}/cards`, { CardID: card.id })
        console.log(`  day ${String(day).padStart(2)}  ${card.title}`)
    }

    await summary(get, monthPath, label)
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** --month YYYY-MM, or this month. Month 1–12. */
function targetMonth(value) {
    if (!value) {
        const now = new Date()
        return { year: now.getFullYear(), month: now.getMonth() + 1 }
    }
    const match = value.match(/^(\d{4})-(\d{1,2})$/)
    const month = match ? Number(match[2]) : 0
    if (!match || month < 1 || month > 12)
        throw new Error(`--month takes YYYY-MM, for example 2025-01. Got "${value}".`)
    return { year: Number(match[1]), month }
}

async function summary(get, monthPath, label) {
    const dates = (await get(monthPath)).dates ?? []
    const onDays = dates.filter(date => (date.cards ?? []).length > 0)
    const cards = onDays.reduce((sum, date) => sum + date.cards.length, 0)

    console.log(`\nDone: ${label} has ${cards} card(s) across ${onDays.length} day(s).`)
    console.log(`Open http://localhost:54671/calendar`)
}

main().catch(error => {
    console.error(`\n${error.message}`)
    process.exit(1)
})
