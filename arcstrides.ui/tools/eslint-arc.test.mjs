/**
 * eslint-arc.test.mjs
 *
 * The rules in eslint-arc.js, each run on a few lines that should pass and a few
 * that should not — so a change to a rule that stops it catching what it was
 * written for fails here, rather than going quiet over the real code.
 *
 *   node tools/eslint-arc.test.mjs      (part of npm run check)
 */

import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import arc from './eslint-arc.js'

// Paths under a made-up root: the rules decide by folder and file name, not by content on disk.
const linter = new Linter({ configType: 'flat', cwd: '/x' })
const lint = (filename, code) => linter.verify(code, [{
  files: ['**/*.{ts,tsx}'],
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { arc },
  rules: { 'arc/file-named-for-export': 'error', 'arc/private-last': 'error', 'arc/no-space-before-paren': 'error', 'arc/fonts-from-fonts': 'error', 'arc/colours-from-palette': 'error' },
}], { filename }).map(m => m.ruleId ? `${m.ruleId}@${m.line}` : m.message)
// [file, code, the rule reports it should produce, as rule@line]
const cases = [
  ['/x/src/Features/A/Thing.tsx', `export const Thing = () => null`, []],
  ['/x/src/Features/A/Thing.tsx', `export const Other = () => null`, ['arc/file-named-for-export@1']],
  ['/x/src/Features/A/Board.Colours.ts', `export const a = 1`, []],
  ['/x/src/Features/A/useThing.ts', `export function useThing() {}`, []],
  ['/x/src/Features/A/T.ts', `export const T = helper()\nfunction helper() { return 1 }`, ['arc/private-last@2']],
  ['/x/src/Features/A/T.ts', `export const T = () => helper()\n// ── Private ─────\nfunction helper() { return 1 }`, []],
  ['/x/src/Features/A/T.ts', `const RAMP = [1]\nexport const T = () => RAMP\n// ── Private ─────\n`, ['arc/private-last@1']],
  ['/x/src/Features/A/T.ts', `const RAMP = [1]\nexport const T = RAMP.length\n// ── Private ─────\n`, []],
  ['/x/src/Features/A/T.ts', `interface TProps { a: number }\nexport const T = (p: TProps) => p\n`, []],
  ['/x/src/Features/A/T.ts', `export const T = () => 1\n// ── Private ─────\nexport const U = 2`, ['arc/private-last@3']],
  ['/x/src/Features/A/T.ts', `export const T = () => foo (1)\nexport function T2 (a: number) { return a }`, ['arc/no-space-before-paren@1', 'arc/no-space-before-paren@2']],
  ['/x/src/Features/A/T.ts', `export const T = () => { if (x) return foo(1); return new Map() }`, []],
  ['/x/src/Features/A/T.tsx', `export const T = { fontFamily: "Georgia, serif", color: '#ff0000', shadow: 'rgba(38, 28, 10, .3)', hue: 'rgb(200, 40, 40)' }`, ['arc/fonts-from-fonts@1', 'arc/colours-from-palette@1', 'arc/colours-from-palette@1']],
  ['/x/src/Styles/Palette.ts', `export const P = '#ff0000'`, []],
  ['/x/src/Features/A/T.ts', 'export const T = (id: string) => `url(#${id}-cut)`', []],
]
let bad = 0
for (const [file, code, want] of cases) {
  const got = lint(file, code)
  const ok = JSON.stringify(got.sort()) === JSON.stringify([...want].sort())
  if (!ok) bad++
  console.log(ok ? 'ok  ' : 'FAIL', file.split('/').pop(), JSON.stringify(got))
}
// And the one fixer: the space goes, nothing else moves.
const fixed = new Linter({ configType: 'flat', cwd: '/x' }).verifyAndFix(`export const T = () => foo (1)`, [{ files: ['**/*.ts'], languageOptions: { parser: tseslint.parser }, plugins: { arc }, rules: { 'arc/no-space-before-paren': 'error' } }], { filename: '/x/src/F/T.ts' })
if (fixed.output !== 'export const T = () => foo(1)') bad++
console.log(fixed.output === 'export const T = () => foo(1)' ? 'ok  ' : 'FAIL', 'fixer', JSON.stringify(fixed.output))
console.log(bad ? `${bad} failed` : `all ${cases.length + 1} passed`)
process.exit(bad ? 1 : 0)
