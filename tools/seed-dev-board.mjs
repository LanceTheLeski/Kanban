/**
 * Seeds a demo board into whatever storage ArcStrides.API is pointed at.
 *
 * Intended for a fresh Azurite instance, where every table starts empty and the
 * board renders as nothing at all. See docs/local-development.md.
 *
 * It goes through the HTTP API rather than writing table rows directly, so it
 * cannot drift from the entity shapes, and it exercises the same create paths the
 * UI does. Node 18+; no dependencies.
 *
 *   node tools/seed-dev-board.mjs
 *   node tools/seed-dev-board.mjs --force              # seed again even if populated
 *   node tools/seed-dev-board.mjs --url http://localhost:5100
 *
 * Defaults to the plain-HTTP endpoint that the `https` launch profile also binds,
 * which avoids having to trust the dev certificate from Node.
 */

const args = process.argv.slice(2)
const flag = (name, fallback) => {
    const index = args.indexOf(`--${name}`)
    return index === -1 ? fallback : args[index + 1]
}

const BASE = (flag('url', 'http://localhost:5100')).replace(/\/$/, '')
const FORCE = args.includes('--force')

// The board the UI redirects to from "/" — see arcstrides.ui/src/App.tsx.
const BOARD_ID = flag('board', '1cb0ce6e-6145-4fe7-833a-0b7c0545c449')

// Task types are fetched unfiltered (TaskController queries `taskType => true`),
// so the tag group they sit under is arbitrary — it just has to be a valid GUID.
const TAG_GROUP_ID = '7b3f1c94-4d2e-4a61-9f0c-2e5a8d1b6c73'

// ── HTTP ──────────────────────────────────────────────────────────────────────

async function send(method, path, body) {
    let response
    try {
        response = await fetch(`${BASE}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    } catch (error) {
        throw new Error(
            `Could not reach the API at ${BASE}. Is it running?\n` +
            `  dotnet run --project ArcStrides.API --launch-profile https\n` +
            `  (${error.message})`
        )
    }

    const text = await response.text()
    if (!response.ok) {
        throw new Error(`${method} ${path} → ${response.status}\n${text.slice(0, 400)}`)
    }
    return text ? JSON.parse(text) : null
}

const get = path => send('GET', path)
const post = (path, body) => send('POST', path, body)

// ── Seed data ─────────────────────────────────────────────────────────────────

const COLUMNS = ['Backlog', 'In Progress', 'Review', 'Done']
const SWIMLANES = ['Platform', 'Frontend']
const TASK_TYPES = ['Chore', 'Bug', 'Feature']

const CARDS = [
    { title: 'Migrate auth service', description: 'Move the token exchange off the legacy host.', column: 'Backlog', swimlane: 'Platform' },
    { title: 'Table storage retries', description: 'Back off on 429 from Azure Tables.', column: 'In Progress', swimlane: 'Platform' },
    { title: 'Ship the conversion', description: 'Green build, green lint.', column: 'Done', swimlane: 'Platform' },
    { title: 'Calendar page', description: 'Still to be converted from Blazor.', column: 'Backlog', swimlane: 'Frontend' },
    { title: 'Board drag and drop', description: 'dnd-kit replaces MudDropContainer.', column: 'In Progress', swimlane: 'Frontend' },
    { title: 'Swimlane reorder bug', description: 'Cards should follow their column.', column: 'Review', swimlane: 'Frontend' },
]

const TASKS = [
    { card: 'Migrate auth service', title: 'Audit callers', type: 'Chore', order: 1, isComplete: true },
    { card: 'Migrate auth service', title: 'Cut over', type: 'Feature', order: 2, isComplete: false },
    { card: 'Board drag and drop', title: 'Drag handle', type: 'Feature', order: 1, isComplete: true },
]

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`Seeding board ${BOARD_ID} at ${BASE}\n`)

    const existing = await get(`/arcstrides/boards/${BOARD_ID}`)
    const populated = (existing?.columns?.length ?? 0) > 0 || (existing?.cards?.length ?? 0) > 0

    if (populated && !FORCE) {
        console.log(
            `Board already has ${existing.columns?.length ?? 0} column(s) and ` +
            `${existing.cards?.length ?? 0} card(s). Nothing to do.\n` +
            `Pass --force to add this seed on top of what is there.`
        )
        return
    }

    const columns = {}
    for (const [index, title] of COLUMNS.entries()) {
        const created = await post(`/arcstrides/boards/${BOARD_ID}/columns`, { Title: title, Order: index })
        columns[title] = created.id
        console.log(`  column    ${title}`)
    }

    const swimlanes = {}
    for (const [index, title] of SWIMLANES.entries()) {
        const created = await post(`/arcstrides/boards/${BOARD_ID}/swimlanes`, { Title: title, Order: index })
        swimlanes[title] = created.id
        console.log(`  swimlane  ${title}`)
    }

    const taskTypes = {}
    for (const title of TASK_TYPES) {
        const created = await post(`/arcstrides/taggroups/${TAG_GROUP_ID}/tasks/types`, { Title: title })
        taskTypes[title] = created.id
        console.log(`  task type ${title}`)
    }

    for (const card of CARDS) {
        await post(`/arcstrides/boards/${BOARD_ID}/cards`, {
            Title: card.title,
            Description: card.description,
            ColumnID: columns[card.column],
            SwimlaneID: swimlanes[card.swimlane],
        })
        console.log(`  card      ${card.title}`)
    }

    // POST /cards answers with a CardPositionResponse, whose `id` is the position
    // row rather than the card — the new card's own ID never comes back. Read the
    // board to find the IDs the tasks need to hang off.
    const board = await get(`/arcstrides/boards/${BOARD_ID}`)
    const cardIdByTitle = Object.fromEntries((board.cards ?? []).map(card => [card.title, card.id]))

    for (const task of TASKS) {
        const cardId = cardIdByTitle[task.card]
        if (!cardId) {
            console.log(`  !! no card "${task.card}" to attach "${task.title}" to — skipped`)
            continue
        }
        await post(`/arcstrides/boards/${BOARD_ID}/cards/${cardId}/tasks`, {
            Title: task.title,
            TaskTypeID: taskTypes[task.type],
            Order: task.order,
            IsComplete: task.isComplete,
        })
        console.log(`  task      ${task.card} → ${task.title}`)
    }

    const final = await get(`/arcstrides/boards/${BOARD_ID}`)
    console.log(
        `\nDone: ${final.columns?.length ?? 0} columns, ${final.swimlanes?.length ?? 0} swimlanes, ` +
        `${final.cards?.length ?? 0} cards.\n` +
        `Open http://localhost:54671/board/${BOARD_ID}`
    )
}

main().catch(error => {
    console.error(`\n${error.message}`)
    process.exit(1)
})
