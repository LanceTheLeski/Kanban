/**
 * Prints a board's rows straight out of table storage, and says which of the
 * API's board-level uniqueness rules they break.
 *
 *   node tools/inspect-board.mjs
 *   node tools/inspect-board.mjs --board <guid>
 *   node tools/inspect-board.mjs --connection "UseDevelopmentStorage=true"
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * GET /arcstrides/boards/{id} validates the whole board before returning it, so
 * a single bad row makes the entire board unreadable through the API — and the
 * thing you need in order to understand why is the data the API is refusing to
 * show you. This reads the tables directly, which is the one view that still
 * works when the board will not load.
 *
 * The checks below deliberately mirror BoardColumnEnumerableValidator and
 * BoardSwimlaneEnumerableValidator. They are a copy, so they can drift; the API
 * is the authority. This is a diagnostic, not a second opinion.
 *
 * See docs/local-development.md.
 */

import { TableClient } from '@azure/data-tables'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
    const index = args.indexOf(`--${name}`)
    return index === -1 ? fallback : args[index + 1]
}

const CONNECTION = flag('connection', 'UseDevelopmentStorage=true')
const BOARD_ID = flag('board', '1cb0ce6e-6145-4fe7-833a-0b7c0545c449')

const options = { allowInsecureConnection: true }

/** Every row in one table for one board. The partition key is the board ID. */
async function rowsFor(tableName) {
    const client = TableClient.fromConnectionString(CONNECTION, tableName, options)
    const rows = []
    try {
        const query = client.listEntities({
            queryOptions: { filter: `PartitionKey eq '${BOARD_ID}'` },
        })
        for await (const row of query) rows.push(row)
    } catch (error) {
        throw new Error(
            `Could not read ${tableName}: ${error.message}\n` +
            `Is Azurite running and provisioned?  node tools/dev-up.mjs`
        )
    }
    return rows
}

/**
 * The repeated values in a list.
 *
 * Unset is counted separately rather than folded in under a sentinel key: any
 * sentinel drawn from the same namespace as the values is a string some row
 * could legitimately hold, and a collision there would misreport the very thing
 * this is meant to diagnose.
 */
function duplicates(values, caseInsensitive = false) {
    const counts = new Map()
    let unsetCount = 0

    for (const value of values) {
        if (value === null || value === undefined) {
            unsetCount += 1
            continue
        }
        const key = caseInsensitive ? String(value).toLowerCase() : String(value)
        counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const repeated = [...counts]
        .filter(([, count]) => count > 1)
        .map(([key, count]) => `${key} x${count}`)

    if (unsetCount > 1) repeated.unshift(`(not set) x${unsetCount}`)
    return repeated
}

const show = value => (value === null || value === undefined ? '(not set)' : value)

function report(label, rows, fields) {
    console.log(`\n-- ${label} (${rows.length}) ${'-'.repeat(Math.max(0, 50 - label.length))}`)
    if (rows.length === 0) {
        console.log('   none')
        return { conflicts: [], unset: [] }
    }

    for (const row of rows) {
        const shown = fields.map(({ name }) => `${name}=${show(row[name])}`).join('  ')
        console.log(`   ${row.rowKey}\n      ${shown}`)
    }

    const conflicts = []
    const unset = []
    for (const { name, unique, caseInsensitive } of fields) {
        if (!unique) continue
        const values = rows.map(row => row[name])
        const repeated = duplicates(values, caseInsensitive)
        if (repeated.length === 0) continue

        // A checked field that is unset on *every* row is reported separately: it
        // is duplicated only by omission, which reads differently from two rows
        // genuinely claiming the same order.
        if (values.every(value => value === null || value === undefined))
            unset.push(`${label}: ${name} is unset on every row`)
        else
            conflicts.push(`${label}: ${name} must be unique — repeated: ${repeated.join(', ')}`)
    }
    return { conflicts, unset }
}

/*
 * `unique: false` fields are shown but not checked.
 *
 * The API used to demand that the colour and Global*Order fields be distinct too,
 * and those rules have been removed: nothing ever writes those fields, so every
 * row held the same unset value and a board with two swimlanes could not be read
 * at all. Mirroring them here produced the same noise, and worse, an earlier
 * version of this tool filed them under "unset on every row, so not what
 * changed" -- which sounded reasonable and pointed away from the actual cause.
 * They are still printed, because seeing that a field is blank everywhere is
 * useful; they are simply no longer treated as faults.
 */
const COLUMN_FIELDS = [
    { name: 'Title', unique: true, caseInsensitive: true },
    { name: 'ColumnOrder', unique: true },
    { name: 'GlobalColumnOrder' },
    { name: 'ColumnColor' },
    { name: 'GlobalColumnColor' },
]

const SWIMLANE_FIELDS = [
    { name: 'Title', unique: true, caseInsensitive: true },
    { name: 'SwimlaneOrder', unique: true },
    { name: 'GlobalSwimlaneOrder' },
    { name: 'SwimlaneColor' },
    { name: 'GlobalSwimlaneColor' },
]

async function main() {
    console.log(`Board ${BOARD_ID}`)

    const columns = await rowsFor('Columns')
    const swimlanes = await rowsFor('Swimlanes')
    const cardPositions = await rowsFor('CardPositions')

    const columnReport = report('Columns', columns, COLUMN_FIELDS)
    const swimlaneReport = report('Swimlanes', swimlanes, SWIMLANE_FIELDS)

    const conflicts = [...columnReport.conflicts, ...swimlaneReport.conflicts]
    const unset = [...columnReport.unset, ...swimlaneReport.unset]

    // Card positions are not validated by the board endpoint, but a swimlane
    // insert or reorder that half-applied shows up here as positions pointing at
    // an order no swimlane holds any more.
    console.log(`\n-- CardPositions (${cardPositions.length}) ${'-'.repeat(36)}`)
    const swimlaneOrders = new Set(swimlanes.map(swimlane => swimlane.SwimlaneOrder))
    if (cardPositions.length === 0) console.log('   none')
    for (const position of cardPositions) {
        const orphan = swimlaneOrders.has(position.SwimlaneOrder)
            ? ''
            : '   <- no swimlane at this order'
        console.log(
            `   ${position.rowKey}  SwimlaneOrder=${show(position.SwimlaneOrder)}` +
            `  ColumnOrder=${show(position.ColumnOrder)}${orphan}`
        )
    }

    console.log(`\n${'='.repeat(62)}`)
    if (conflicts.length === 0) {
        console.log(
            'No conflicting values found. If the board still will not load, the\n' +
            'cause is not one of the uniqueness rules checked here.'
        )
    } else {
        console.log(`${conflicts.length} conflicting value(s) — this is what breaks the board:\n`)
        for (const conflict of conflicts) console.log(`   ${conflict}`)
        console.log(
            `\nThe board endpoint validates before it returns, so this has to be\n` +
            `resolved before the board loads again.`
        )
    }

    if (unset.length > 0) {
        console.log(
            `\nUnset on every row (not an error — nothing writes these yet):\n` +
            unset.map(line => `   ${line}`).join('\n')
        )
    }
}

main().catch(error => {
    console.error(`\n${error.message}`)
    process.exit(1)
})
