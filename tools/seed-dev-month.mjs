/**
 * Seeds the calendar's month: a row for every day, and the seeded board's cards
 * pinned to a few of them.
 *
 * Intended for a fresh Azurite instance, where the Dates table exists but holds
 * nothing and the calendar says "No days are stored for this month yet." Run it
 * after seed-dev-board.mjs. See docs/local-development.md.
 *
 *   node tools/seed-dev-month.mjs                    # this month
 *   node tools/seed-dev-month.mjs --month 2025-01    # a particular one
 *   node tools/seed-dev-month.mjs --no-cards         # days only
 *
 * Safe to run again: days that already exist are skipped, and cards are pinned
 * only while no day in the month has any.
 *
 * ── Days go through the API, cards cannot ────────────────────────────────────
 * Each day is a POST to arcstrides/calendars/months/{monthID}/dates, the same as
 * seed-dev-board creating its columns — so the Date rows are whatever the API
 * makes them.
 *
 * Putting a card on a day has no endpoint. The API reads a day's cards through
 * three links, and nothing writes the first of them:
 *
 *   Dates.CardTagGroupID ──► TagGroups row  (PartitionKey = group, RowKey = tag)
 *                             ──► Tags row  (PartitionKey = tag,   RowKey = card)
 *                                   ──► the card
 *
 * CreateDate stores Guid.Empty in CardTagGroupID and the date PATCH does not
 * expose it; POST /tags is refused by an inverted parent check (docs/api-gaps.md,
 * #1). So those rows are written straight into table storage — the only part of
 * either seeder that does. The shapes match what TagController and
 * CalendarController.FetchMonth use, and the script reads the month back through
 * the API afterwards to prove the API sees them.
 *
 * Each card goes on one day only. A card on two days of the same month made
 * FetchMonth answer 500 for the whole month until that was fixed, and an older
 * API may still have the bug.
 */

import { TableClient } from '@azure/data-tables'
import { randomUUID } from 'node:crypto'
import { connectToApi } from './dev-api.mjs'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
    const index = args.indexOf(`--${name}`)
    return index === -1 ? fallback : args[index + 1]
}

// The month /calendar redirects to — see arcstrides.ui/src/App.tsx. The API has
// no way to look a month up by date, so this ID is the only one the UI opens.
const MONTH_ID = flag('id', '6469d898-c468-4c84-82f9-6dcad60757a8')
const BOARD_ID = flag('board', '1cb0ce6e-6145-4fe7-833a-0b7c0545c449')
const CONNECTION = flag('connection', 'UseDevelopmentStorage=true')
const NO_CARDS = args.includes('--no-cards')

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

// Where the board's cards land, in days from today (or from the 15th, for a
// month that is not this one). The same offset twice makes a busy day.
const OFFSETS = [0, 2, -3, 6, 6, 6, 9, -8, 12, -12]

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
    const { year, month } = targetMonth(flag('month', null))
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstWeekday = new Date(year, month, 1).getDay()
    const label = `${MONTH_NAMES[month]} ${year}`

    const { base, get, post } = await connectToApi({ url: flag('url', null), probe: monthPath() })
    console.log(`Seeding ${label} into month ${MONTH_ID} at ${base}\n`)

    const existing = (await get(monthPath())).dates ?? []

    // A month ID holds one month. Mixing a second into it would leave the UI
    // choosing between two sets of days with the same numbers.
    const other = existing.find(date => date.monthName !== MONTH_NAMES[month] || date.yearOrder !== year)
    if (other) {
        throw new Error(
            `Month ${MONTH_ID} already holds ${other.monthName} ${other.yearOrder}, not ${label}.\n` +
            `Seed that month instead (--month ${other.yearOrder}-${String(MONTH_NAMES.indexOf(other.monthName) + 1).padStart(2, '0')}), ` +
            `or start over: node tools/dev-up.mjs --drop, then both seed scripts.`
        )
    }

    // ── Days ──────────────────────────────────────────────────────────────────

    const have = new Set(existing.map(date => date.dateOrder))
    let added = 0
    for (let day = 1; day <= daysInMonth; day++) {
        if (have.has(day)) continue
        await post(monthPath('/dates'), {
            DateOrder: day,
            WeekOrder: Math.floor((day - 1 + firstWeekday) / 7),
            DayOfTheWeekOrder: (day - 1 + firstWeekday) % 7,
            MonthOrder: month,
            MonthName: MONTH_NAMES[month],
            Year: year,
        })
        added += 1
    }
    console.log(`  days      ${added} added, ${daysInMonth - added} already there`)

    // ── Cards ─────────────────────────────────────────────────────────────────

    if (NO_CARDS) return finish(get, label)

    const dates = (await get(monthPath())).dates ?? []
    if (dates.some(date => (date.cards ?? []).length > 0)) {
        console.log(`  cards     already pinned to this month — left as they are`)
        return finish(get, label)
    }

    const board = await get(`/arcstrides/boards/${BOARD_ID}`)
    const cards = board?.cards ?? []
    if (cards.length === 0) {
        console.log(`  cards     board ${BOARD_ID} has none to pin — run seed-dev-board.mjs first for some`)
        return finish(get, label)
    }

    const anchor = isThisMonth(year, month) ? new Date().getDate() : 15
    const byDay = new Map()
    cards.slice(0, OFFSETS.length).forEach((card, index) => {
        const day = Math.min(Math.max(anchor + OFFSETS[index], 1), daysInMonth)
        byDay.set(day, [...(byDay.get(day) ?? []), card])
    })

    console.log(`  cards     writing tag rows to ${describeConnection(CONNECTION)}`)
    const tables = {
        dates: tableClient('Dates'),
        tagGroups: tableClient('TagGroups'),
        tags: tableClient('Tags'),
    }

    for (const [day, dayCards] of [...byDay].sort(([a], [b]) => a - b)) {
        const date = dates.find(candidate => candidate.dateOrder === day)
        if (!date) continue

        // One group per day, one tag per card in it. Written group-first so a
        // failure part-way leaves rows nothing points at, rather than a day
        // pointing at a group that is not there.
        const group = randomUUID()
        for (const card of dayCards) {
            const tag = randomUUID()
            await tables.tagGroups.createEntity({
                partitionKey: group,
                rowKey: tag,
                Title: `${label}, day ${day}`,
                TagGroupTypeID: 0,
            })
            await tables.tags.createEntity({
                partitionKey: tag,
                rowKey: card.id,
                // TagTypeID 3 is a card — see TagRepository.ParentExistsAsync.
                ParentObjectTypeName: 'Card',
                Title: card.title,
                TagTypeID: 3,
            })
        }

        // DateResponse.ID is the row's PartitionKey; the month ID is its RowKey.
        await tables.dates.updateEntity({
            partitionKey: date.id,
            rowKey: MONTH_ID,
            CardTagGroupID: { value: group, type: 'Guid' },
        }, 'Merge')

        console.log(`  day ${String(day).padStart(2)}    ${dayCards.map(card => card.title).join(', ')}`)
    }

    await finish(get, label, true)
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** --month YYYY-MM, or this month. */
function targetMonth(value) {
    if (!value) {
        const now = new Date()
        return { year: now.getFullYear(), month: now.getMonth() }
    }
    const match = value.match(/^(\d{4})-(\d{1,2})$/)
    const month = match ? Number(match[2]) - 1 : -1
    if (!match || month < 0 || month > 11)
        throw new Error(`--month takes YYYY-MM, for example 2025-01. Got "${value}".`)
    return { year: Number(match[1]), month }
}

function monthPath(suffix = '') {
    return `/arcstrides/calendars/months/${MONTH_ID}${suffix}`
}

function isThisMonth(year, month) {
    const now = new Date()
    return now.getFullYear() === year && now.getMonth() === month
}

/**
 * Never print a connection string as given: it may carry an AccountKey. The
 * emulator's key is public, but this script accepts --connection, and a message
 * that echoes a real key ends up in scrollback and CI logs.
 */
function describeConnection(connection) {
    if (connection === 'UseDevelopmentStorage=true') return 'Azurite'
    if (!connection.includes('AccountKey')) return connection
    const account = connection.match(/AccountName=([^;]+)/)?.[1] ?? 'unknown account'
    return `${account} (key redacted)`
}

function tableClient(name) {
    return TableClient.fromConnectionString(CONNECTION, name, { allowInsecureConnection: true })
}

/**
 * Reads the month back through the API and says what it sees — which is the
 * only proof that the rows written directly are rows the API reads. If the API
 * is pointed at different storage from --connection, this is where it shows.
 */
async function finish(get, label, expectCards = false) {
    const dates = (await get(monthPath())).dates ?? []
    const pinned = dates.reduce((sum, date) => sum + (date.cards ?? []).length, 0)

    console.log(`\nDone: ${label} has ${dates.length} days and ${pinned} card(s) on them.`)
    if (expectCards && pinned === 0)
        console.log(
            `!! The cards were written but the API does not see them. It is probably\n` +
            `   reading different storage from ${describeConnection(CONNECTION)} — check\n` +
            `   AzureTables:ServiceEndpoint, or pass --connection to match it.`
        )
    console.log(`Open http://localhost:54671/calendar`)
}

main().catch(error => {
    console.error(`\n${error.message}`)
    process.exit(1)
})
