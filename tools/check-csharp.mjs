/**
 * check-csharp.mjs
 *
 * The API's C# house style, checked. See docs/csharp-conventions.md for the
 * rules and why each is the way it is.
 *
 *   node tools/check-csharp.mjs             every .cs file in ArcStrides.API and ArcStrides.Contracts
 *   node tools/check-csharp.mjs <files…>    just these
 *   node tools/check-csharp.mjs --fix       and put the spacing and the indentation right
 *
 * Exits 1, with a line per finding, if anything is out of style. --fix mends
 * what a machine can — a missing space before "(", tabs, a missing byte order
 * mark — and reports the rest, which want a person: a negation, a null check,
 * a name.
 *
 * ── Why not dotnet format ────────────────────────────────────────────────────
 * `dotnet format whitespace` can put a space before every parameter list — the
 * option is csharp_space_between_method_call_name_and_opening_parenthesis — but
 * it cannot check that without checking every other whitespace rule too, and
 * two of those disagree with this code on purpose: it strips the space from
 * `(int) value`, and it pulls a one-line `{ return …; }` under a `catch` back to
 * the catch's own indent. There is no option for either. So this checks the
 * house rules and nothing else, and .editorconfig carries the spacing options
 * for the editor to type with.
 *
 * ── How ──────────────────────────────────────────────────────────────────────
 * Each file is read through a mask that blanks out comments, strings — plain,
 * verbatim and interpolated, holes and all — and character literals, keeping
 * every line where it was. The rules are patterns over what is left, which is
 * only code. A line that has a reason to break a rule says so with a trailing
 * `// house-style: allow` and a word on why.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const RULES = [
    {
        id: 'space-before-paren',
        // A name, a keyword or a closing generic argument list, then "(" with nothing between.
        pattern: /[A-Za-z0-9_]\(|\w<[\w<>,.?[\] ]*>\(/g,
        message: 'A space before every parameter or argument list: Parse (value), Count (), new Card (), if (…).',
        // The new() in a generic constraint is a keyword, not a call: `where T : class, new()`.
        allow: (line, match) => /\bwhere\b.*\bnew\($/.test(line.slice(0, match.index + match[0].length)),
    },
    {
        id: 'null-check',
        pattern: /[=!]=\s*null\b|\bnull\s*[=!]=/g,
        message: 'Compare with null by pattern: `is null`, `is not null`.',
    },
    {
        id: 'negation',
        // A prefix "!": not "!=", and not the null-forgiving "value!" after a name or a bracket.
        pattern: /(?<=^|[\s(=&|,:?{[])!(?=[A-Za-z_(@])/g,
        message: 'Negate with `is false`, not "!": `if (result.IsValid is false)`.',
    },
    {
        id: 'id-casing',
        pattern: /\b(?:[A-Za-z0-9]*[a-z0-9])?Id(?:s|[A-Z0-9]\w*)?\b/g,
        message: '"ID", in capitals, wherever it appears in a name: boardID, CardID, IDFor.',
    },
    {
        id: 'namespace',
        pattern: /^\uFEFF?namespace [\w.]+\s*$/g,
        message: 'A file-scoped namespace: `namespace ArcStrides.API.Controllers;`.',
    },
    {
        id: 'private-field',
        pattern: /^\s*private (?:static )?(?:readonly )?(?!const\b)[\w<>,.?[\] ]+? [a-z]\w*\s*[;=]/g,
        message: 'A private field is _camelCase: private readonly ICardRepository _cardRepository;',
    },
    {
        id: 'async-suffix',
        // A method that returns a Task, declared in a repository or a service, without the suffix.
        pattern: /\bTask(?:<[^()]*>)? +[A-Z]\w*(?<!Async) \(/g,
        message: 'A repository or service method that returns a Task ends in Async: GetCardAsync (…).',
        files: /[\\/](?:Repositories|Services)[\\/]/,
    },
    {
        id: 'action-name',
        // An endpoint is named for what it does to the resource; the framework already knows it is async.
        pattern: /^\s*public async Task<I?ActionResult(?:<[^()]*>)?> +\w+Async \(/g,
        message: 'A controller action is named for its endpoint, without Async: FetchBoard, CreateBoardSwimlane.',
        files: /[\\/]Controllers[\\/]/,
    },
    {
        id: 'tabs',
        pattern: /^\t+/g,
        message: 'Indent with four spaces, not tabs.',
    },
]

/**
 * Every finding in one file's text, as { line, column, rule, message }. The
 * rules that hold only in some folders — the naming ones — need the file's path.
 */
export function check(text, file = '') {
    const code = mask(text).split('\n')
    const raw = text.split('\n')
    const findings = []
    code.forEach((line, index) => {
        if (/\/\/\s*house-style:\s*allow\b/.test(raw[index])) return
        for (const rule of RULES) {
            if (rule.files && !rule.files.test(file)) continue
            for (const match of line.matchAll(rule.pattern))
                if (!rule.allow?.(line, match)) findings.push({ line: index + 1, column: match.index + 1, rule: rule.id, message: rule.message })
        }
    })
    return findings
}

/**
 * Every finding in a whole file: check's, and the one rule that is about the
 * file rather than its lines — it starts with a byte order mark, as Visual
 * Studio saves it and as every other file here does.
 */
export function checkFile(text, file = '') {
    const bom = text.startsWith('\uFEFF')
        ? []
        : [{ line: 1, column: 1, rule: 'encoding', message: 'Save as UTF-8 with a byte order mark, as Visual Studio does.' }]
    return [...bom, ...check(text, file)]
}

/**
 * The text with its missing spaces before "(" put in, and its tab indents
 * turned to four spaces each. Nothing else is touched.
 */
export function fix(text) {
    const code = mask(text).split('\n')
    const spacing = RULES.find(rule => rule.id === 'space-before-paren')
    return text.split('\n').map((line, index) => {
        if (/\/\/\s*house-style:\s*allow\b/.test(line)) return line
        const parens = [...code[index].matchAll(spacing.pattern)]
            .filter(match => !spacing.allow(code[index], match))
            .map(match => match.index + match[0].length - 1)
        let fixed = line
        for (const at of parens.reverse()) fixed = fixed.slice(0, at) + ' ' + fixed.slice(at)
        return fixed.replace(/^\t+/, tabs => '    '.repeat(tabs.length))
    }).join('\n')
}

/**
 * The text with comments, strings and character literals blanked to spaces,
 * newlines kept — so what remains is code, on the lines it was on.
 */
export function mask(text) {
    let out = ''
    let at = 0
    while (at < text.length) {
        const end = skip(text, at)
        if (end > at) {
            out += text.slice(at, end).replace(/[^\n]/g, ' ')
            at = end
        } else {
            out += text[at]
            at += 1
        }
    }
    return out
}

// ── Run ───────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
    const mending = process.argv.includes('--fix')
    const given = process.argv.slice(2).filter(arg => arg !== '--fix')
    const files = given.length
        ? given.map(file => path.resolve(file))
        : ['ArcStrides.API', 'ArcStrides.Contracts'].flatMap(project => csharpFiles(path.join(root, project)))

    let count = 0
    for (const file of files) {
        if (mending) {
            const text = fs.readFileSync(file, 'utf8')
            const fixed = (text.startsWith('\uFEFF') ? '' : '\uFEFF') + fix(text)
            if (fixed !== text) fs.writeFileSync(file, fixed)
        }
        for (const finding of checkFile(fs.readFileSync(file, 'utf8'), file)) {
            count += 1
            console.log(`${path.relative(root, file)}:${finding.line}:${finding.column}  ${finding.rule}  ${finding.message}`)
        }
    }
    console.log(count ? `\n${count} out of style in ${files.length} files.` : `${files.length} files follow the house style.`)
    process.exit(count ? 1 : 0)
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/**
 * Where the comment, string or character literal starting at `at` ends — or
 * `at` itself, if none starts there.
 */
function skip(text, at) {
    const two = text.slice(at, at + 2)
    if (two === '//') {
        const end = text.indexOf('\n', at)
        return end === -1 ? text.length : end
    }
    if (two === '/*') {
        const end = text.indexOf('*/', at + 2)
        return end === -1 ? text.length : end + 2
    }
    const prefix = /^(\$@|@\$|\$|@)?"/.exec(text.slice(at, at + 3))
    if (prefix) return stringEnd(text, at + prefix[0].length, prefix[1] ?? '')
    if (text[at] === "'") {
        const end = text[at + 1] === '\\' ? text.indexOf("'", at + 3) : at + 2
        if (end !== -1 && text[end] === "'") return end + 1
    }
    return at
}

/** The end of a string whose body starts at `at`: escapes, "" in verbatim, and {holes} in interpolated. */
function stringEnd(text, at, prefix) {
    const verbatim = prefix.includes('@')
    const interpolated = prefix.includes('$')
    let i = at
    while (i < text.length) {
        const c = text[i]
        if (!verbatim && c === '\\') { i += 2; continue }
        if (c === '"') {
            if (verbatim && text[i + 1] === '"') { i += 2; continue }
            return i + 1
        }
        if (interpolated && c === '{') {
            if (text[i + 1] === '{') { i += 2; continue }
            i = holeEnd(text, i + 1)
            continue
        }
        if (!verbatim && c === '\n') return i
        i += 1
    }
    return i
}

/** Past the `}` that closes an interpolation hole, stepping over strings inside it. */
function holeEnd(text, at) {
    let depth = 1
    let i = at
    while (i < text.length && depth > 0) {
        const end = skip(text, i)
        if (end > i) { i = end; continue }
        if (text[i] === '{') depth += 1
        if (text[i] === '}') depth -= 1
        i += 1
    }
    return i
}

/** Every .cs file under a project, leaving out the build's own bin and obj. */
function csharpFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return ['bin', 'obj'].includes(entry.name) ? [] : csharpFiles(full)
        return entry.name.endsWith('.cs') ? [full] : []
    })
}
