/**
 * eslint-arc.js
 *
 * This project's own lint rules: the conventions in docs/ui-conventions.md that
 * a general-purpose rule set has no opinion on, written down as checks so they
 * are kept rather than remembered.
 *
 *   arc/file-named-for-export    a file is named for what it exports
 *   arc/private-last             unexported helpers go last, under the banner
 *   arc/no-space-before-paren    `foo(bar)`, not the API's C# `Foo (bar)`
 *   arc/fonts-from-fonts         font stacks come from Styles/Fonts.ts
 *   arc/colours-from-palette     colours come from Styles/ — see Palette.ts
 *
 * Each rule's message names the section of the conventions doc it enforces,
 * which is where the reasons are. A deliberate exception is an
 * `// eslint-disable-next-line arc/…` with a comment saying why.
 *
 * Wired in by eslint.config.js; `npm run lint` and `npm run check` run it.
 */

import path from 'node:path'

const DOC = 'docs/ui-conventions.md'

// ── arc/file-named-for-export ────────────────────────────────────────────────

/**
 * The file's name matches its primary export: `DayCell.tsx` exports DayCell,
 * `useGridDaySize.ts` exports useGridDaySize. Two kinds of module are named for
 * what they hold instead, and are not checked: a feature's module of related
 * helpers, `Feature.Thing.ts`, and a module in Styles/ or Lib/, which belongs
 * to no feature. main.tsx is Vite's entry point.
 */
const fileNamedForExport = {
    meta: {
        type: 'suggestion',
        docs: { description: 'A component or hook file is named for its primary export.' },
        schema: [],
        messages: {
            mismatch: `{{file}} exports {{exports}}, not {{expected}}. Name the file for its primary export (${DOC}, "File naming").`,
        },
    },
    create(context) {
        const file = context.filename
        const base = path.basename(file).replace(/\.(tsx?|jsx?)$/, '')
        const folder = path.basename(path.dirname(file))
        if (base.includes('.') || base === 'main' || folder === 'Styles' || folder === 'Lib') return {}

        const exported = new Set()
        return {
            ExportNamedDeclaration(node) {
                for (const name of declaredNames(node.declaration)) exported.add(name)
                for (const specifier of node.specifiers ?? []) exported.add(specifier.exported.name)
            },
            ExportDefaultDeclaration(node) {
                const declaration = node.declaration
                if (declaration.type === 'Identifier') exported.add(declaration.name)
                else for (const name of declaredNames(declaration)) exported.add(name)
            },
            'Program:exit'(program) {
                if (exported.has(base)) return
                context.report({
                    node: program,
                    messageId: 'mismatch',
                    data: {
                        file: path.basename(file),
                        exports: exported.size ? [...exported].join(', ') : 'nothing',
                        expected: base,
                    },
                })
            },
        }
    },
}

// ── arc/private-last ─────────────────────────────────────────────────────────

/**
 * Public first; private — unexported — last, under the banner:
 *
 *     // ── Private ─────────────────────────────────────────────────────────
 *     // Not exported, which is this language's `private`. Ordered by first use above.
 *
 * Two things may stay above it. Types — a component's Props, a store's State,
 * an API module's wire shapes — describe the file's public surface and are read
 * first. And a `const` that is read while the module is being evaluated — in
 * another top-level initialiser, not inside a function — has to be declared
 * before that read, or it throws; functions hoist, so they never need to.
 */
const privateLast = {
    meta: {
        type: 'suggestion',
        docs: { description: 'Unexported helpers go last, under the Private banner.' },
        schema: [],
        messages: {
            noBanner: `{{name}} is private: move it below a "// ── Private ──" banner at the end of the file (${DOC}, "Member ordering").`,
            aboveBanner: `{{name}} is private: move it below the Private banner (${DOC}, "Member ordering").`,
            belowBanner: `{{name}} is exported: move it above the Private banner (${DOC}, "Member ordering").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        return {
            Program(program) {
                const banner = source.getAllComments().find(comment => comment.type === 'Line' && /^\s*── Private ─/.test(comment.value))
                const bannerAt = banner ? banner.range[0] : Infinity

                const exportedByName = new Set()
                for (const statement of program.body)
                    if (statement.type === 'ExportDefaultDeclaration' && statement.declaration.type === 'Identifier')
                        exportedByName.add(statement.declaration.name)
                    else if (statement.type === 'ExportNamedDeclaration' && !statement.declaration)
                        for (const specifier of statement.specifiers) exportedByName.add(specifier.local.name)

                // Everything the public part of the file reads while it is evaluated.
                const readEarly = new Set()
                for (const statement of program.body)
                    if (statement.range[0] < bannerAt) collectEvaluationReads(statement, source.visitorKeys, readEarly)

                for (const statement of program.body) {
                    const isExport = statement.type.startsWith('Export')
                    const names = isExport ? [] : declaredNames(statement)
                    const isPrivateRuntime = !isExport && names.length > 0
                                             && ['VariableDeclaration', 'FunctionDeclaration', 'ClassDeclaration'].includes(statement.type)
                                             && !names.some(name => exportedByName.has(name))

                    if (isPrivateRuntime && statement.range[0] < bannerAt) {
                        const needed = statement.type !== 'FunctionDeclaration' && names.some(name => readEarly.has(name))
                        if (!needed)
                            context.report({ node: statement, messageId: banner ? 'aboveBanner' : 'noBanner', data: { name: names.join(', ') } })
                    }
                    if (isExport && statement.range[0] > bannerAt && statement.type !== 'ExportDefaultDeclaration')
                        context.report({ node: statement, messageId: 'belowBanner', data: { name: declaredNames(statement.declaration).join(', ') || 'this' } })
                }
            },
        }
    },
}

// ── arc/no-space-before-paren ────────────────────────────────────────────────

/**
 * The API is C#, written `ParentExistsAsync (Guid parentID)`. TypeScript here is
 * written `parentExists(parentID)`: every tool in the JS ecosystem assumes it,
 * and mixing the two in one language is worse than either. Calls, `new`, and
 * named functions and methods; fixable.
 */
const noSpaceBeforeParen = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'No space between a name and its parameter or argument list.' },
        schema: [],
        messages: {
            space: `No space before "(" in TypeScript — that is the API's C# style (${DOC}, "C# style is not carried across").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        const check = (before, node) => {
            if (!before) return
            const paren = source.getTokenAfter(before)
            if (!paren || paren.value !== '(' || paren.loc.start.line !== before.loc.end.line) return
            if (!source.isSpaceBetween(before, paren)) return
            context.report({ node, loc: paren.loc, messageId: 'space', fix: fixer => fixer.removeRange([before.range[1], paren.range[0]]) })
        }
        const lastTokenOf = node => node && source.getLastToken(node)
        return {
            CallExpression(node) {
                if (node.optional) return
                check(lastTokenOf(node.typeArguments ?? node.callee), node)
            },
            NewExpression(node) {
                if (source.getLastToken(node).value !== ')') return
                check(lastTokenOf(node.typeArguments ?? node.callee), node)
            },
            'FunctionDeclaration, TSDeclareFunction'(node) {
                if (node.id) check(lastTokenOf(node.typeParameters ?? node.id), node)
            },
            MethodDefinition(node) {
                check(lastTokenOf(node.value.typeParameters ?? node.key), node)
            },
        }
    },
}

// ── arc/fonts-from-fonts ─────────────────────────────────────────────────────

/**
 * A font stack written inline stops being one stack: the next file writes its
 * own, a fallback goes missing, and two halves of one screen fall back to
 * different faces. Every `fontFamily` names one from Styles/Fonts.ts.
 */
const fontsFromFonts = {
    meta: {
        type: 'suggestion',
        docs: { description: 'Font stacks come from Styles/Fonts.ts.' },
        schema: [],
        messages: {
            inline: `Font stack written inline: use one from Styles/Fonts.ts, adding it there if it is new (${DOC}, "Shared values live in a module").`,
        },
    },
    create(context) {
        if (context.filename.endsWith(path.join('Styles', 'Fonts.ts'))) return {}
        return {
            Property(node) {
                const key = node.key.type === 'Identifier' ? node.key.name : node.key.value
                if (key !== 'fontFamily') return
                const text = staticString(node.value)
                if (text !== null && text !== 'inherit') context.report({ node: node.value, messageId: 'inline' })
            },
        }
    },
}

// ── arc/colours-from-palette ─────────────────────────────────────────────────

/**
 * Colours are written in Styles/ — the paper ladders in Palette.ts, the
 * theme's tokens in Theme.tsx — and nowhere else, so every colour with a hue is
 * one of the palette's. Outside Styles/, a hex colour, or an rgb() with any real
 * hue to it, is a colour that has left the family. The neutrals — shadows, the
 * glass film, white and black at an opacity — are fine anywhere.
 *
 * The one other home is the chart palette in Calendar.Stats: task types need
 * eight colours that tell apart at a glance, which four soft paper hues cannot.
 */
const coloursFromPalette = {
    meta: {
        type: 'suggestion',
        docs: { description: 'Colours come from Styles/ — the palette and the theme.' },
        schema: [],
        messages: {
            literal: `Colour "{{colour}}" written here: take it from Styles/Palette.ts, Styles/Scenery.ts or a theme token (${DOC}, "The palette").`,
        },
    },
    create(context) {
        const file = context.filename
        if (file.includes(`${path.sep}Styles${path.sep}`) || file.endsWith(path.join('Calendar', 'Calendar.Stats.ts'))) return {}

        const check = (node, text) => {
            for (const match of text.matchAll(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/g))
                context.report({ node, messageId: 'literal', data: { colour: match[0] } })
            for (const match of text.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
                const [r, g, b] = match.slice(1, 4).map(Number)
                if (Math.max(r, g, b) - Math.min(r, g, b) > HUED) context.report({ node, messageId: 'literal', data: { colour: match[0] + ')' } })
            }
        }
        return {
            Literal(node) {
                if (typeof node.value === 'string') check(node, node.value)
            },
            TemplateElement(node) {
                check(node, node.value.cooked ?? '')
            },
        }
    },
}

// ── The plugin ────────────────────────────────────────────────────────────────

export default {
    meta: { name: 'eslint-plugin-arc' },
    rules: {
        'file-named-for-export': fileNamedForExport,
        'private-last': privateLast,
        'no-space-before-paren': noSpaceBeforeParen,
        'fonts-from-fonts': fontsFromFonts,
        'colours-from-palette': coloursFromPalette,
    },
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

/** The names a declaration introduces, including every binding in a destructure. */
function declaredNames(node) {
    if (!node) return []
    if (node.type === 'VariableDeclaration') return node.declarations.flatMap(declaration => bindingNames(declaration.id))
    return node.id?.name ? [node.id.name] : []
}

function bindingNames(pattern) {
    switch (pattern.type) {
        case 'Identifier': return [pattern.name]
        case 'ObjectPattern': return pattern.properties.flatMap(property => bindingNames(property.type === 'RestElement' ? property.argument : property.value))
        case 'ArrayPattern': return pattern.elements.filter(Boolean).flatMap(bindingNames)
        case 'AssignmentPattern': return bindingNames(pattern.left)
        case 'RestElement': return bindingNames(pattern.argument)
        default: return []
    }
}

/**
 * Every identifier `node` reads while the module is evaluated: everywhere but
 * inside a function, whose body runs later, if at all.
 */
function collectEvaluationReads(node, keys, into) {
    if (!node || typeof node.type !== 'string') return
    if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) return
    // Types are erased before anything runs: `typeof MENUS` in a type reads nothing.
    if (node.type.startsWith('TS') && !EVALUATED_TS.has(node.type)) return
    if (node.type === 'Identifier') into.add(node.name)

    // A name being declared, a property's name and a member's name are not reads.
    const skip = node.type === 'VariableDeclarator' ? ['id']
        : node.type === 'ClassDeclaration' ? ['id', 'body']
        : node.type === 'MemberExpression' && !node.computed ? ['property']
        : node.type === 'Property' && !node.computed ? ['key']
        : []
    for (const key of (keys[node.type] ?? []).filter(key => !skip.includes(key))) {
        const child = node[key]
        if (Array.isArray(child)) child.forEach(item => collectEvaluationReads(item, keys, into))
        else collectEvaluationReads(child, keys, into)
    }
}

/** The TypeScript nodes that are expressions, and run: everything else `TS…` is a type. */
const EVALUATED_TS = new Set(['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression',
                              'TSInstantiationExpression', 'TSTypeAssertion', 'TSEnumDeclaration'])

/** A string's value, when it is one written out whole; null for anything computed. */
function staticString(node) {
    if (node.type === 'Literal' && typeof node.value === 'string') return node.value
    if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked
    return null
}

/**
 * How far apart an rgb()'s channels may be before it counts as a colour rather
 * than a tinted grey. The app's shadows are warm near-blacks — rgba(38, 28, 10)
 * is 28 apart — and stay under it; anything with a hue anyone would name does not.
 */
const HUED = 40
