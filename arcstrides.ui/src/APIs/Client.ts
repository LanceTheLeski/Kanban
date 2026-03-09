/**
 * client.ts
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
        // Try to extract a meaningful error message from the response body.
        // ASP.NET Core Problem Details (RFC 7807) uses a "title" field.
        let message = `${response.status} ${response.statusText}`
        try {
            const body = await response.json()
            message = body.title ?? body.message ?? message
        } catch {
            // Response body wasn't JSON — use the status text
        }
        throw new Error(`API error on ${options.method ?? 'GET'} ${path}: ${message}`)
    }

    return response
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