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
import { layoutRules } from './eslint-arc-layout.js'

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

// The layout rules: each before → after, through every layout fixer at once,
// so a case also proves the rules agree with one another on it.
const layout = Object.fromEntries(Object.keys(layoutRules).map(rule => [`arc/${rule}`, 'error']))
const restyle = (filename, code) => new Linter({ configType: 'flat', cwd: '/x' }).verifyAndFix(code, [{
  files: ['**/*.{ts,tsx}'],
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { arc },
  rules: layout,
}], { filename })
const layoutCases = [
  ['braces on their own lines', 'T.ts',
   'function f(a: number) {\n    if (a) {\n        g()\n    } else {\n        h()\n    }\n}\n',
   'function f(a: number)\n{\n    if (a)\n    {\n        g()\n    }\n    else\n    {\n        h()\n    }\n}\n'],
  ['an arrow\'s block, under its close', 'T.ts',
   'const x = useCallback((card: Card) => {\n    open(card)\n}, [open])\n',
   'const x = useCallback((card: Card) =>\n{\n    open(card)\n}, [open])\n'],
  ['try and catch', 'T.ts',
   'try {\n    a()\n} catch (error) {\n    b()\n}\n',
   'try\n{\n    a()\n}\ncatch (error)\n{\n    b()\n}\n'],
  ['a one-line block stays', 'T.ts', 'const f = () => { refresh() }\n', 'const f = () => { refresh() }\n'],
  ['interfaces, and their members', 'T.ts',
   'interface A {\n    a: number\n    /** b */\n    b: number\n    c: number\n}\ninterface P {\n    x: number\n    y: number\n}\n',
   'interface A\n{\n    a: number\n\n    /** b */\n    b: number\n\n    c: number\n}\ninterface P\n{\n    x: number\n    y: number\n}\n'],
  ['a literal an arrow returns, or a const holds', 'T.ts',
   'const A: number[] = [\n    1,\n]\nconst f = () => ({\n    a: 1,\n})\n',
   'const A: number[] =\n[\n    1,\n]\nconst f = () =>\n({\n    a: 1,\n})\n'],
  ['a one-statement body below', 'T.ts',
   'if (!actions) throw new Error(\'no\')\nfor (const a of b) c(a)\n',
   'if (!actions)\n    throw new Error(\'no\')\nfor (const a of b)\n    c(a)\n'],
  ['else if, and a one-line block left alone', 'T.ts',
   'if (a)\n    b()\nelse if (c) d()\nconst f = () => { if (x) y() }\n',
   'if (a)\n    b()\nelse if (c)\n    d()\nconst f = () => { if (x) y() }\n'],
  ['a ternary, from the line', 'T.ts',
   'function f()\n{\n    return error instanceof Error ? error.message : String(error)\n}\n',
   'function f()\n{\n    return error instanceof Error\n        ? error.message\n        : String(error)\n}\n'],
  ['a ternary, from its property', 'T.tsx',
   'const x = <Icon sx={{ ml: 1,\n                      visibility: on ? \'visible\' : \'hidden\' }} />\n',
   'const x = <Icon sx={{ ml: 1,\n                      visibility: on\n                          ? \'visible\'\n                          : \'hidden\'\n                   }} />\n'],
  ['a ternary inside a template keeps the text', 'T.ts',
   'const s = `a\n  b ${n === 1 ? \'x\' : \'y\'}`\n',
   'const s = `a\n  b ${n === 1\n      ? \'x\'\n      : \'y\'}`\n'],
  ['children padded, attributes not', 'T.tsx',
   'const x = <Box sx={{ p: 1 }}>{label}{open && <Icon />}</Box>\n',
   'const x = <Box sx={{ p: 1 }}>{ label }{ open && <Icon /> }</Box>\n'],
  ['a chain, and its callback\'s JSX', 'T.tsx',
   'const x = <Menu>\n    {items.filter(item => item.on).map(item => (\n        <Item key={item.id} />\n    ))}\n</Menu>\n',
   'const x = <Menu>\n    { items.filter(item => item.on)\n           .map(item =>\n                (\n                    <Item key={item.id} />\n                ))\n    }\n</Menu>\n'],
  ['wrapped attributes realigned', 'T.tsx',
   'const x = <Box a={1}\n                b={2} />\n',
   'const x = <Box a={1}\n               b={2} />\n'],
  ['an object that wraps, a property per line', 'T.tsx',
   'const x = <Box sx={{ opacity: dragging ? 0.4 : 1, width: \'100%\' }} />\n',
   'const x = <Box sx={{ opacity: dragging\n                         ? 0.4\n                         : 1,\n                     width: \'100%\'\n                  }} />\n'],
  ['a quiet file keeps attributes together', 'T.tsx',
   'const x = <Box a={1} b={2} c={3} />\n', 'const x = <Box a={1} b={2} c={3} />\n'],
  ['a busy file puts each on its own line', 'T.tsx',
   'const x = <A><B /><C /><D /><E /><F /><G /><H /><I /><J a={1} b={2} /></A>\n',
   'const x = <A><B /><C /><D /><E /><F /><G /><H /><I /><J a={1}\n                                                        b={2} /></A>\n'],
]
for (const [what, file, before, after] of layoutCases) {
  const { output, messages } = restyle(`/x/src/F/${file}`, before)
  const ok = output === after && messages.length === 0
  if (!ok) bad++
  console.log(ok ? 'ok  ' : 'FAIL', what, ok ? '' : `\n--- got\n${output}\n--- left\n${JSON.stringify(messages.map(m => m.ruleId + '@' + m.line))}`)
}

console.log(bad ? `${bad} failed` : `all ${cases.length + 1 + layoutCases.length} passed`)
process.exit(bad ? 1 : 0)
