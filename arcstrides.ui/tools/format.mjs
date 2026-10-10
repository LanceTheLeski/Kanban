/**
 * format.mjs
 *
 * Puts every file into the shape docs/ui-conventions.md describes: ESLint's
 * fixers for the layout rules, run until they stop changing anything, then
 * reflow.py for the JSX alignment — and both again, until neither has more to
 * do. One of either can leave work for the other: a brace moved to its own line
 * shifts nothing reflow cares about, but a child padded to `{ x }` moves the
 * attributes after it a column.
 *
 *   npm run format
 */

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILES = ['src/**/*.{ts,tsx}', 'vite.config.ts']
const ROUNDS = 20

const eslint = new ESLint({ cwd: root, fix: true })
let changed = 0
for (let round = 0; round < ROUNDS; round += 1) {
    const fixed = await eslintToStandstill()
    const reflowed = execFileSync('python3', [path.join(root, 'tools', 'reflow.py')], { cwd: root, encoding: 'utf8' })
    changed += fixed
    if (!/reflowed:/.test(reflowed)) {
        console.log(changed ? `Formatted, in ${round + 1} round${round ? 's' : ''}.` : 'Every file already follows the conventions.')
        process.exit(0)
    }
    changed += 1
}
console.log(`Still changing after ${ROUNDS} rounds — two rules disagree somewhere. Run \`npx eslint .\` and \`npm run format:check\` to see where.`)
process.exit(1)

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** ESLint's fixers, again and again, until a pass changes nothing; how many passes did. */
async function eslintToStandstill() {
    for (let passes = 0; passes < ROUNDS; passes += 1) {
        const results = await eslint.lintFiles(FILES)
        if (!results.some(result => result.output !== undefined)) return passes
        await ESLint.outputFixes(results)
    }
    return ROUNDS
}
