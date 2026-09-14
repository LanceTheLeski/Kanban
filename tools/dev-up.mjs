/**
 * Brings local storage up: starts Azurite if it is not already running, then
 * creates the tables.
 *
 * This is the one command to run before pressing F5 in Visual Studio.
 *
 *   node tools/dev-up.mjs
 *   node tools/dev-up.mjs --drop        # recreate every table: a clean slate
 *   node tools/dev-up.mjs --no-start    # only provision; assume Azurite is running
 *   node tools/dev-up.mjs --location X  # where Azurite keeps its files
 *
 * ── Why this exists even though Visual Studio can start Azurite ───────────────
 * VS can launch the emulator for you (Connected Services → Add service
 * dependency → Storage Azurite emulator), but that only covers the emulator.
 * The tables would still not exist, because the API deliberately never calls
 * CreateIfNotExists — see provision-azurite.mjs for why. A fresh emulator plus a
 * running API means every request fails with TableNotFound.
 *
 * So the two steps belong together, and doing both here keeps one command to
 * remember instead of two to remember in order.
 *
 * ── It is safe to run repeatedly ─────────────────────────────────────────────
 * Already running and already provisioned is the normal case, and it is a no-op:
 * an emulator that is up is left alone rather than started twice on a port that
 * is taken.
 *
 * See docs/local-development.md.
 */

import { spawn } from 'node:child_process'
import { connect } from 'node:net'
import { mkdir, open, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
    const index = args.indexOf(`--${name}`)
    return index === -1 ? fallback : args[index + 1]
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCATION = resolve(flag('location', join(REPO_ROOT, '.azurite')))
const NO_START = args.includes('--no-start')

/** Azurite's well-known emulator ports. Only the table one matters to ArcStrides. */
const TABLE_PORT = 10002

// ── Is it already up? ─────────────────────────────────────────────────────────

/**
 * A TCP connect rather than an HTTP request: it answers the only question being
 * asked — is something listening — without depending on which paths Azurite
 * serves or how it responds to an unauthenticated GET.
 */
function isListening(port, timeout = 500) {
    return new Promise(resolve => {
        const socket = connect({ port, host: '127.0.0.1' })
        const done = result => {
            socket.destroy()
            resolve(result)
        }
        socket.setTimeout(timeout)
        socket.once('connect', () => done(true))
        socket.once('timeout', () => done(false))
        socket.once('error', () => done(false))
    })
}

/**
 * Waits for the port, but gives up the moment the process we are waiting on dies.
 * Polling the port alone means a missing `azurite` command — the most likely
 * failure on a machine that has never run this — takes the full timeout to
 * report something that was knowable immediately.
 */
async function waitForPort(port, hasExited, seconds = 20) {
    for (let attempt = 0; attempt < seconds * 4; attempt++) {
        if (await isListening(port)) return true
        if (hasExited()) return false
        await new Promise(resolve => setTimeout(resolve, 250))
    }
    return false
}

// ── Starting it ───────────────────────────────────────────────────────────────

/**
 * Detached, with its output redirected to a file. Azurite runs for as long as you
 * are working, which is longer than this script: staying attached would either
 * make this command never return or kill the emulator on the way out.
 */
async function startAzurite() {
    await mkdir(LOCATION, { recursive: true })
    const logPath = join(LOCATION, 'azurite.log')
    const log = await open(logPath, 'a')

    // shell: true so this finds azurite.cmd on Windows, where a global npm
    // install puts a .cmd shim on PATH rather than an executable.
    const child = spawn('azurite', ['--silent', '--location', LOCATION], {
        detached: true,
        stdio: ['ignore', log.fd, log.fd],
        shell: true,
    })

    // With shell: true a missing command is not a spawn 'error' — the shell starts
    // fine and exits 127 — so watch for the exit as well.
    let spawnError = null
    let exited = false
    child.once('error', error => { spawnError = error; exited = true })
    child.once('exit', () => { exited = true })
    child.unref()

    const ready = await waitForPort(TABLE_PORT, () => exited)
    await log.close()

    if (!ready) {
        throw new Error(
            `Azurite did not start listening on ${TABLE_PORT}.\n` +
            (spawnError ? `  ${spawnError.message}\n` : '') +
            (await tail(logPath)) +
            `If the command is missing, install it with:  npm install -g azurite\n` +
            `Full output: ${logPath}`
        )
    }

    return logPath
}

/** The last few lines of the log, which is where the real reason usually is. */
async function tail(path, lines = 5) {
    try {
        const text = await readFile(path, 'utf8')
        const kept = text.trimEnd().split('\n').slice(-lines).filter(Boolean)
        return kept.length ? kept.map(line => `  ${line}`).join('\n') + '\n' : ''
    } catch {
        return ''
    }
}

// ── Provisioning ──────────────────────────────────────────────────────────────

/**
 * Runs the existing provisioning script rather than duplicating it, so the table
 * names still come from one place.
 */
function provision() {
    return new Promise((resolvePromise, rejectPromise) => {
        const passThrough = args.includes('--drop') ? ['--drop'] : []
        const child = spawn(
            process.execPath,
            [join(REPO_ROOT, 'tools', 'provision-azurite.mjs'), '--no-next-steps', ...passThrough],
            { stdio: 'inherit' }
        )
        child.once('error', rejectPromise)
        child.once('exit', code =>
            code === 0 ? resolvePromise() : rejectPromise(new Error(`Provisioning failed (exit ${code}).`)))
    })
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
    if (await isListening(TABLE_PORT)) {
        console.log(`Azurite is already listening on ${TABLE_PORT}; leaving it alone.\n`)
    } else if (NO_START) {
        throw new Error(
            `Nothing is listening on ${TABLE_PORT} and --no-start was given.\n` +
            `Start the emulator first:  azurite --silent --location ${LOCATION}`
        )
    } else {
        console.log(`Starting Azurite in ${LOCATION}`)
        const logPath = await startAzurite()
        console.log(`  listening on ${TABLE_PORT}, logging to ${logPath}\n`)
    }

    await provision()

    console.log(
        `\nStorage is ready. Start the API (F5 in Visual Studio, or\n` +
        `  dotnet run --project ArcStrides.API --launch-profile https\n` +
        `), then seed a board with:\n` +
        `  node tools/seed-dev-board.mjs`
    )
}

main().catch(error => {
    console.error(`\n${error.message}`)
    process.exit(1)
})
