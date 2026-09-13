/**
 * Creates the ArcStrides tables in a local Azurite instance.
 *
 * This is the local stand-in for whoever created the tables in the Azure portal:
 * a one-time setup step that runs *outside* the API. The API itself never creates
 * a table — in Development or anywhere else — so the code path against the
 * emulator is the same code path that runs against the real storage account.
 *
 *   node tools/provision-azurite.mjs
 *   node tools/provision-azurite.mjs --drop     # delete and recreate: a clean slate
 *   node tools/provision-azurite.mjs --connection "UseDevelopmentStorage=true"
 *
 * Prerequisites:
 *   npm install            (in this tools/ directory, once)
 *   azurite --silent --location ./.azurite
 *
 * See docs/local-development.md.
 */

import { TableServiceClient } from '@azure/data-tables'
import { readdir, readFile } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
    const index = args.indexOf(`--${name}`)
    return index === -1 ? fallback : args[index + 1]
}

const CONNECTION = flag('connection', 'UseDevelopmentStorage=true')
const DROP = args.includes('--drop')

/**
 * Never print a connection string as given: it may carry an AccountKey. The
 * emulator's key is public, but this script accepts --connection, and a message
 * that echoes a real key ends up in scrollback and CI logs.
 */
function describeConnection(connection) {
    if (!connection.includes('AccountKey')) return connection
    const account = connection.match(/AccountName=([^;]+)/)?.[1] ?? 'unknown account'
    const endpoint = connection.match(/TableEndpoint=([^;]+)/)?.[1] ?? 'default endpoint'
    return `${account} at ${endpoint} (key redacted)`
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API_ROOT = join(REPO_ROOT, 'ArcStrides.API')

// ── Which tables? ─────────────────────────────────────────────────────────────

/**
 * Read the table names out of the [ArcTableName("…")] attributes on the entity
 * models rather than keeping a list here. A list would drift the first time
 * someone adds an entity, and the drift would only show up as a TableNotFound at
 * runtime.
 */
async function discoverTableNames() {
    const files = []

    async function walk(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            if (entry.name === 'bin' || entry.name === 'obj') continue
            const path = join(directory, entry.name)
            if (entry.isDirectory()) await walk(path)
            else if (entry.name.endsWith('.cs')) files.push(path)
        }
    }
    await walk(API_ROOT)

    const names = new Set()
    for (const file of files) {
        const source = await readFile(file, 'utf8')
        for (const match of source.matchAll(/\[\s*ArcTableName\s*\(\s*"([^"]+)"\s*\)\s*\]/g)) {
            names.add(match[1])
        }
    }

    return [...names].sort()
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
    const tableNames = await discoverTableNames()

    if (tableNames.length === 0) {
        throw new Error(
            `Found no [ArcTableName] attributes under ${API_ROOT}.\n` +
            `Run this from a checkout of the repository.`
        )
    }

    console.log(`Provisioning ${tableNames.length} table(s) via ${describeConnection(CONNECTION)}\n`)

    const client = TableServiceClient.fromConnectionString(CONNECTION, { allowInsecureConnection: true })

    // Read what is there first. This doubles as the connectivity check — failing
    // here names the cause, instead of failing part-way through the loop — and it
    // is how the run below can report accurately: TableServiceClient.createTable
    // does not raise on a table that already exists, so a thrown 409 cannot be
    // relied on to tell the two apart.
    let existing
    try {
        existing = new Set()
        for await (const table of client.listTables())
            existing.add(table.name)
    } catch (error) {
        throw new Error(
            `Could not reach table storage at ${describeConnection(CONNECTION)}.\n` +
            `Start the emulator first:\n` +
            `  azurite --silent --location ./.azurite\n` +
            `  (${error.message})`
        )
    }

    let created = 0
    for (const tableName of tableNames) {
        if (DROP && existing.has(tableName)) {
            await client.deleteTable(tableName)
            existing.delete(tableName)
            console.log(`  dropped  ${tableName}`)
        }

        if (existing.has(tableName)) {
            console.log(`  exists   ${tableName}`)
            continue
        }

        await client.createTable(tableName)
        created += 1
        console.log(`  created  ${tableName}`)
    }

    console.log(
        `\n${created} created, ${tableNames.length - created} already present.\n` +
        `Start the API, then seed it:\n` +
        `  dotnet run --project ArcStrides.API --launch-profile https\n` +
        `  node tools/seed-dev-board.mjs`
    )
}

main().catch(error => {
    console.error(`\n${error.message}`)
    process.exit(1)
})
