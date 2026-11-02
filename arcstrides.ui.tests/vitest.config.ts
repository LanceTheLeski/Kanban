/**
 * vitest.config.ts
 *
 * The UI's code is imported as `@ui/…` — `@ui/Features/Calendar/Calendar.Stats`
 * — rather than by a path climbing out of this project.
 *
 * That code finds its libraries in the UI's node_modules, as it always does. A
 * library a test imports itself must be found in the same place, or the test
 * cannot find it at all; and installing it here as well would load two copies,
 * with a date made by one not always taken for a date by the other. So each is
 * pointed at the UI's copy, here and in tsconfig.json: today only dayjs.
 *
 * Every test runs in Chicago's time, whatever the machine's zone, so that a
 * local midnight — which the UI reads as "no time" — is the same instant on
 * every machine. Setup.test.ts fails if that ever stops holding.
 */

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: [
            { find: /^@ui\//, replacement: ui('src/') },
            { find: /^dayjs$/, replacement: ui('node_modules/dayjs') },
        ],
    },
    test: {
        include: ['src/**/*.test.ts'],
        env: { TZ: 'America/Chicago' },
    },
})

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** A path in the UI project. */
function ui(path: string): string
{
    return fileURLToPath(new URL(`../arcstrides.ui/${path}`, import.meta.url))
}
