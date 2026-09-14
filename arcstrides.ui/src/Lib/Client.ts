/**
 * Client.ts
 *
 * Base HTTP client for all API calls.
 *
 * ── Why a wrapper instead of calling fetch() directly ─────────────────────────
 * Raw fetch() has a known footgun: it only rejects on network failure, not on
 * 4xx/5xx responses. A 404 or 500 returns a resolved promise with ok=false,
 * which is easy to miss. This wrapper converts non-ok responses into thrown
 * errors so every caller can rely on catch/finally for error handling without
 * manually checking response.ok each time.
 *
 * ── Base URL ──────────────────────────────────────────────────────────────────
 * Read from VITE_API_BASE_URL (set in .env.development / .env.production).
 * Vite only exposes variables prefixed with VITE_ to client code — anything
 * else stays server-side only and will be undefined here.
 *
 * ── JSON Patch ────────────────────────────────────────────────────────────────
 * The Blazor backend expects PATCH requests as JSON Patch documents
 * (RFC 6902 — arrays of {op, path, value} operations).
 * The patch() helper sets Content-Type to application/json-patch+json,
 * which is the correct MIME type for this format and what ASP.NET Core's
 * [FromBody] JsonPatchDocument<T> parameter expects.
 */

// ── Environment ───────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!BASE_URL) {
    throw new Error(
        'VITE_API_BASE_URL is not defined. ' +
        'Add it to .env.development (local) or .env.production (deployed).'
    )
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single JSON Patch operation (RFC 6902) */
export interface PatchOperation {
    op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
    path: string
    value?: unknown
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

/**
 * Makes a fetch call, throws on non-2xx, returns the parsed Response.
 * Callers call .json() on the result themselves — this keeps the function
 * generic and avoids double-parsing for void responses (DELETE, some PATCHes).
 */
async function request(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    if (!response.ok) {
        throw new Error(`API error on ${options.method ?? 'GET'} ${path}: ${await describeFailure(response)}`)
    }

    return response
}

/**
 * The most useful thing the response can tell us about why it failed.
 *
 * This used to read `body.title ?? body.message` off the parsed JSON, which
 * covers ASP.NET Core's Problem Details but nothing else — and this API mostly
 * does not send Problem Details. `return BadRequest("The Swimlane was invalid…")`
 * sends the string as a bare JSON string, and a string has no `.title` and no
 * `.message`, so every one of those reasons was parsed and then dropped in
 * favour of the status line. Worse, `statusText` is empty over HTTP/2, so a
 * carefully worded rejection arrived as the four characters "400 ".
 *
 * The body is read as text once and parsed from there, so an unparseable body is
 * still reported rather than discarded, and there is no second read of a stream
 * that has already been consumed.
 */
async function describeFailure(response: Response): Promise<string> {
    const status = `${response.status} ${response.statusText}`.trim()

    let raw: string
    try {
        raw = await response.text()
    } catch {
        return status
    }
    if (!raw.trim()) return status

    let detail = raw
    try {
        const body: unknown = JSON.parse(raw)
        if (typeof body === 'string') {
            detail = body
        } else if (body !== null && typeof body === 'object') {
            const problem = body as Record<string, unknown>
            // ValidationProblemDetails puts the useful part under `errors`, keyed by
            // field, and its `title` is the generic "One or more validation errors
            // occurred." — so the specifics have to be pulled out separately.
            const errors = problem.errors && typeof problem.errors === 'object'
                ? Object.values(problem.errors as Record<string, unknown>).flat().join('; ')
                : ''
            const headline = [problem.title, problem.detail, problem.message]
                .find(value => typeof value === 'string' && value.trim()) as string | undefined

            detail = [headline, errors].filter(Boolean).join(' — ') || raw
        }
    } catch {
        // Not JSON. The raw text is still the best answer we have.
    }

    // Keep a snackbar readable; the full body is in the network tab either way.
    const trimmed = detail.replace(/\s+/g, ' ').trim()
    return trimmed.length > 300 ? `${trimmed.slice(0, 300)}…` : trimmed || status
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const apiClient = {
    /** GET — returns parsed JSON */
    get<T>(path: string): Promise<T> {
        return request(path, { method: 'GET' }).then(r => r.json())
    },

    /** POST — sends JSON body, returns parsed JSON */
    post<T>(path: string, body: unknown): Promise<T> {
        return request(path, {
            method: 'POST',
            body: JSON.stringify(body),
        }).then(r => r.json())
    },

    /**
     * PATCH — sends a JSON Patch document (RFC 6902).
     *
     * Content-Type is application/json-patch+json, which is what
     * ASP.NET Core's [FromBody] JsonPatchDocument<T> expects.
     * Returns parsed JSON if the server sends a body (e.g. updated entity),
     * or null for 204 No Content responses.
     */
    async patch<T = void>(path: string, operations: PatchOperation[]): Promise<T> {
        const response = await request(path, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json-patch+json' },
            body: JSON.stringify(operations),
        })
        if (response.status === 204) return undefined as T
        return response.json()
    },

    /** DELETE — expects no response body (204 No Content) */
    async delete(path: string): Promise<void> {
        await request(path, { method: 'DELETE' })
    },
}