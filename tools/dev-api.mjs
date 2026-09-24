/**
 * Finding and calling a locally running ArcStrides.API.
 *
 * Shared by the seed scripts. It lived inside seed-dev-board.mjs until a second
 * seeder needed the same search, and a copy of it would have been a second place
 * for the port list to go stale.
 */

import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Where the API is listening, as a client for it.
 *
 * There is no single right answer: launchSettings.json defines three profiles
 * and they do not agree. "http" and "https" bind 5100, but "IIS Express" binds
 * 18687 — so which port the API is on depends on the profile selected in the
 * Visual Studio toolbar, which a script cannot see. Hard-coding 5100 meant
 * anyone running under IIS Express got "Is it running?" about an API that was
 * running perfectly well on another port.
 *
 * So the candidates are read from launchSettings itself and probed in turn.
 * Only plain-HTTP URLs: the HTTPS ones use the ASP.NET development certificate,
 * which Node rejects unless told not to verify, and quietly disabling TLS
 * verification to seed dev data is not a trade worth making.
 *
 * `probe` is any GET path. Any answer at all — a 404 included — proves something
 * is listening and routing.
 */
export async function connectToApi({ url, probe }) {
    const base = url ? url.replace(/\/$/, '') : await discover(probe)
    return { base, get: path => send(base, 'GET', path), post: (path, body) => send(base, 'POST', path, body) }
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

async function discover(probe) {
    const candidates = await candidateUrls()
    for (const candidate of candidates) {
        try {
            await fetch(`${candidate}${probe}`, { method: 'GET' })
            return candidate
        } catch {
            continue
        }
    }

    throw new Error(
        `Could not reach the API on any URL from launchSettings.json:\n` +
        candidates.map(url => `  ${url}`).join('\n') + `\n\n` +
        `Start it with F5 in Visual Studio, or:\n` +
        `  dotnet run --project ArcStrides.API --launch-profile https\n` +
        `If it is running on something else, pass it:  --url http://localhost:PORT`
    )
}

async function candidateUrls() {
    const urls = []
    try {
        const settingsPath = join(REPO_ROOT, 'ArcStrides.API', 'Properties', 'launchSettings.json')
        // The file is written by Visual Studio and carries a BOM, which JSON.parse
        // rejects — strip it rather than letting a stray character look like a
        // missing file.
        const settings = JSON.parse((await readFile(settingsPath, 'utf8')).replace(/^﻿/, ''))

        for (const profile of Object.values(settings.profiles ?? {}))
            for (const url of String(profile.applicationUrl ?? '').split(';'))
                if (url.startsWith('http://')) urls.push(url.replace(/\/$/, ''))

        const iisUrl = settings.iisSettings?.iisExpress?.applicationUrl
        if (iisUrl?.startsWith('http://')) urls.push(iisUrl.replace(/\/$/, ''))
    } catch {
        // Fall through to the well-known default below.
    }

    if (urls.length === 0) urls.push('http://localhost:5100')
    return [...new Set(urls)]
}

async function send(base, method, path, body) {
    let response
    try {
        response = await fetch(`${base}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    } catch (error) {
        throw new Error(
            `Lost the API at ${base} part-way through seeding.\n` +
            `  (${error.message})`
        )
    }

    const text = await response.text()
    if (!response.ok) {
        throw new Error(`${method} ${path} → ${response.status}\n${text.slice(0, 400)}`)
    }
    return text ? JSON.parse(text) : null
}
