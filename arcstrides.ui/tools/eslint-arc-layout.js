/**
 * eslint-arc-layout.js
 *
 * How a TypeScript file here is laid out — docs/ui-conventions.md, "Layout" —
 * as lint rules. They were written from Lance's own edits to DayActions,
 * MonthView and Calendar.Context, so the code reads the way he writes it,
 * C#-like: braces on their own lines, one thing per line where a line would
 * otherwise hold two.
 *
 *   arc/brace-own-line           a block's "{" on its own line, under its "}"
 *   arc/literal-own-line         a literal an arrow returns, or a const holds, opens on its own line
 *   arc/statement-below          a one-statement if, else, for or while body goes on the next line
 *   arc/ternary-lines            every ternary on three lines
 *   arc/jsx-child-spacing        { a child expression } is padded, and a long one closes on its own line
 *   arc/chain-per-line           a chain of calls over several lines puts each call on its own line
 *   arc/callback-paren           the JSX a callback returns opens with "(" under the callback
 *   arc/attribute-object-close   a multi-line sx={{ … }} closes with "}}" on its own line
 *   arc/member-spacing           a blank line between the members of an interface of three or more
 *   arc/attribute-per-line       in a busy file, every attribute on its own line
 *   arc/attribute-align          wrapped attributes, and a wrapped object's properties, line up under the first
 *
 * Every rule can fix what it reports. `npx eslint --fix` applies them, a few
 * passes at a time, and `npm run format` runs it to a standstill and then
 * reflow.py, which owns the rest of the JSX layout.
 */

const DOC = 'docs/ui-conventions.md'
const INDENT = 4

/** A file that draws this many components is busy: every attribute gets a line. */
export const BUSY = 10

// ── arc/brace-own-line ───────────────────────────────────────────────────────

/**
 * Allman braces: a block that spans lines opens with "{" alone on its line, in
 * the column of the "}" that closes it, and `else`, `catch` and `finally` start
 * the line after that "}". A block that fits on one line — `() => { refresh() }`
 * — stays on it.
 */
const braceOwnLine = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'A multi-line block opens with "{" on a line of its own, under its "}".' },
        schema: [],
        messages: {
            ownLine: `Put this "{" on a line of its own, under its "}" (${DOC}, "Braces").`,
            column: `Line this "{" up with its "}" (${DOC}, "Braces").`,
            keyword: `Start "{{keyword}}" on the line after the "}" (${DOC}, "Braces").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        const block = node => checkOpener(context, source.getFirstToken(node), source.getLastToken(node))
        const keywordAfter = (closing, keyword) => {
            if (!closing || !keyword || closing.loc.end.line !== keyword.loc.start.line) return
            const opening = matchingOpen(source, closing)
            if (opening && opening.loc.start.line === closing.loc.end.line) return
            context.report({
                loc: keyword.loc,
                messageId: 'keyword',
                data: { keyword: keyword.value },
                fix: fixer => fixer.replaceTextRange([closing.range[1], keyword.range[0]], '\n' + pad(lineColumn(source, closing))),
            })
        }
        return {
            BlockStatement: block,
            ClassBody: block,
            TSInterfaceBody: block,
            TSModuleBlock: block,
            TSTypeAliasDeclaration(node) {
                if (node.typeAnnotation.type === 'TSTypeLiteral') block(node.typeAnnotation)
            },
            SwitchStatement(node) {
                checkOpener(context, source.getTokenAfter(node.discriminant, token => token.value === '{'), source.getLastToken(node))
            },
            TSEnumDeclaration(node) {
                checkOpener(context, source.getTokenAfter(node.id, token => token.value === '{'), source.getLastToken(node))
            },
            IfStatement(node) {
                if (node.alternate && node.consequent.type === 'BlockStatement')
                    keywordAfter(source.getLastToken(node.consequent), source.getTokenBefore(node.alternate))
            },
            TryStatement(node) {
                if (node.handler) keywordAfter(source.getLastToken(node.block), source.getFirstToken(node.handler))
                if (node.finalizer)
                    keywordAfter(source.getLastToken(node.handler?.body ?? node.block), source.getTokenBefore(node.finalizer))
            },
        }
    },
}

// ── arc/literal-own-line ─────────────────────────────────────────────────────

/**
 * An object or array that spans lines, returned by an arrow or held by a
 * declaration, opens on a line of its own like a block does:
 *
 *     const ACTIONS: DayAction[] =         useMemo<CalendarActions>(() =>
 *     [                                    ({
 *         …                                    …
 *     ]                                    }), [ … ])
 */
const literalOwnLine = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'A multi-line literal returned by an arrow or held by a declaration opens on its own line.' },
        schema: [],
        messages: {
            ownLine: `Open this literal on a line of its own, under its close (${DOC}, "Braces").`,
            column: `Line this literal's opening up with its close (${DOC}, "Braces").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        const literal = node => {
            const value = unwrapType(node)
            if (value?.type !== 'ObjectExpression' && value?.type !== 'ArrayExpression') return
            let open = source.getFirstToken(value)
            const before = source.getTokenBefore(open)
            if (before?.value === '(' && source.getTokenAfter(source.getLastToken(value))?.value === ')') open = before
            checkOpener(context, open, source.getLastToken(value), 'ownLine')
        }
        return {
            ArrowFunctionExpression(node) {
                if (node.body.type !== 'BlockStatement') literal(node.body)
            },
            VariableDeclarator(node) {
                if (node.init) literal(node.init)
            },
        }
    },
}

// ── arc/statement-below ──────────────────────────────────────────────────────

/**
 * The C# rule: an if, else, for or while whose body is one statement, without
 * braces, puts that statement on the next line, one indent in.
 *
 *     if (!actions)
 *         throw new Error('…')
 *
 * Only for a statement that starts its own line. Inside a block that fits on
 * one line — `onClick={() => { if (open) close() }}` — it stays where it is.
 */
const statementBelow = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'A one-statement body goes on the line below its if, else, for or while.' },
        schema: [],
        messages: {
            below: `Put this statement on the next line, one indent in (${DOC}, "One-statement bodies").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        const check = (keyword, body) => {
            if (!body || ['BlockStatement', 'EmptyStatement', 'IfStatement'].includes(body.type)) return
            // In `else if`, the line starts at the else.
            const before = source.getTokenBefore(keyword)
            const head = keyword.value === 'if' && before?.value === 'else' ? before : keyword
            if (!startsLine(source, head)) return
            const target = indentOf(source, head.loc.start.line) + INDENT
            const previous = source.getTokenBefore(body, { includeComments: true })
            const first = source.getFirstToken(body)
            if (previous.loc.end.line !== first.loc.start.line && first.loc.start.column === target) return
            const onSameLine = previous.loc.end.line === first.loc.start.line
            context.report({
                node: body,
                messageId: 'below',
                fix: fixer => fixer.replaceTextRange([onSameLine ? previous.range[1] : lineStart(first), body.range[1]],
                                                     (onSameLine ? '\n' : '') + pad(target)
                                                     + shifted(source, body.range[0], body.range[1], target - lineColumn(source, first))),
            })
        }
        return {
            IfStatement(node) {
                check(source.getFirstToken(node), node.consequent)
                if (node.alternate) check(source.getTokenBefore(node.alternate), node.alternate)
            },
            'ForStatement, ForInStatement, ForOfStatement, WhileStatement'(node) {
                check(source.getFirstToken(node), node.body)
            },
        }
    },
}

// ── arc/ternary-lines ────────────────────────────────────────────────────────

/**
 * Every ternary on three lines, the "?" and the ":" each starting one, one
 * indent in from where the line holding the condition starts — or from the
 * attribute or property it sits in, when that starts later on the same line.
 *
 *     return error instanceof Error          sx={{ visibility: chosen
 *         ? error.message                                ? 'visible'
 *         : String(error)                                : 'hidden' }}
 */
const ternaryLines = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'Every ternary on three lines.' },
        schema: [],
        messages: {
            lines: `Put this ternary on three lines, "?" and ":" each starting one at column {{column}} (${DOC}, "Ternaries").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        return {
            ConditionalExpression(node) {
                const question = source.getTokenAfter(node.test, token => token.type === 'Punctuator' && token.value === '?')
                const colon = source.getTokenAfter(node.consequent, token => token.type === 'Punctuator' && token.value === ':')
                const first = source.getFirstToken(node)
                let base = indentOf(source, first.loc.start.line)
                for (let around = node.parent; around && around.loc.start.line === first.loc.start.line; around = around.parent)
                    if (around.type === 'JSXAttribute' || around.type === 'Property') {
                        base = Math.max(base, around.loc.start.column)
                        break
                    }
                const target = base + INDENT
                const placed = token => startsLine(source, token) && token.loc.start.column === target
                if (placed(question) && placed(colon)) return

                const testEnd = source.getTokenBefore(question)
                const consequent = [source.getTokenAfter(question), source.getTokenBefore(colon)]
                const alternate = [source.getTokenAfter(colon), source.getLastToken(node)]
                const commented = source.commentsExistBetween(testEnd, consequent[0]) || source.commentsExistBetween(consequent[1], alternate[0])
                const branch = ([from, to]) => shifted(source, from.range[0], to.range[1], target + 2 - lineColumn(source, from))
                context.report({
                    node,
                    messageId: 'lines',
                    data: { column: target + 1 },
                    fix: commented ? null : fixer => fixer.replaceTextRange([testEnd.range[1], alternate[1].range[1]],
                                                                            '\n' + pad(target) + '? ' + branch(consequent)
                                                                            + '\n' + pad(target) + ': ' + branch(alternate)),
                })
            },
        }
    },
}

// ── arc/jsx-child-spacing ────────────────────────────────────────────────────

/**
 * A child expression is padded inside its braces — `{ action.label(day) }` —
 * and one that runs over several lines ends with "}" on a line of its own,
 * under its "{". Attribute values are not children, and keep `={value}`.
 */
const jsxChildSpacing = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'A JSX child expression is padded, and closes on its own line when it spans lines.' },
        schema: [],
        messages: {
            pad: `Pad a child expression with one space inside its braces: { value } (${DOC}, "JSX children").`,
            close: `Close this child expression with "}" on a line of its own, under its "{" (${DOC}, "JSX children").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        return {
            JSXExpressionContainer(node) {
                if (node.parent.type !== 'JSXElement' && node.parent.type !== 'JSXFragment') return
                if (node.expression.type === 'JSXEmptyExpression') return
                const open = source.getFirstToken(node)
                const close = source.getLastToken(node)
                const first = source.getTokenAfter(open, { includeComments: true })
                const last = source.getTokenBefore(close, { includeComments: true })
                const lead = source.text.slice(open.range[1], first.range[0])
                const trail = source.text.slice(last.range[1], close.range[0])

                if (open.loc.start.line === close.loc.end.line) {
                    if (lead !== ' ' || trail !== ' ')
                        context.report({
                            node,
                            messageId: 'pad',
                            fix: fixer => [fixer.replaceTextRange([open.range[1], first.range[0]], ' '),
                                           fixer.replaceTextRange([last.range[1], close.range[0]], ' ')],
                        })
                    return
                }
                const leadOk = lead === ' ' || /^[ \t]*\n/.test(lead)
                const closeOk = startsLine(source, close) && close.loc.start.column === open.loc.start.column
                if (leadOk && closeOk) return
                context.report({
                    node,
                    messageId: leadOk ? 'close' : 'pad',
                    fix: fixer => [
                        ...(leadOk ? [] : [fixer.replaceTextRange([open.range[1], first.range[0]], ' ')]),
                        ...(closeOk ? [] : [fixer.replaceTextRange([last.range[1], close.range[0]], '\n' + pad(open.loc.start.column))]),
                    ],
                })
            },
        }
    },
}

// ── arc/chain-per-line ───────────────────────────────────────────────────────

/**
 * A chain of two or more calls that runs over several lines puts each call on
 * a line of its own, the dots in the column of the first call's:
 *
 *     available.filter(action => !action.last)
 *              .map(action =>
 */
const chainPerLine = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'A chain of calls over several lines puts each call on its own line, dots aligned.' },
        schema: [],
        messages: {
            line: `Start this call on a line of its own, its "." under the first call's (${DOC}, "Chains").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        return {
            CallExpression(node) {
                if (isInnerChainCall(node)) return
                const calls = []
                for (let current = node; ;) {
                    if (current.type === 'ChainExpression' || current.type === 'TSNonNullExpression') current = current.expression
                    else if (current.type === 'CallExpression' && current.callee.type === 'MemberExpression' && !current.callee.computed) {
                        calls.unshift(current)
                        current = current.callee.object
                    } else break
                }
                if (calls.length < 2 || node.loc.start.line === node.loc.end.line) return

                const dots = calls.map(call => source.getTokenBefore(call.callee.property))
                const column = dots[0].loc.start.column
                calls.slice(1).forEach((call, index) => {
                    const dot = dots[index + 1]
                    if (startsLine(source, dot) && dot.loc.start.column === column) return
                    const own = startsLine(source, dot)
                    const previous = source.getTokenBefore(dot, { includeComments: true })
                    const delta = column - (own ? dot.loc.start.column : indentOf(source, dot.loc.start.line))
                    context.report({
                        loc: dot.loc,
                        messageId: 'line',
                        fix: fixer => fixer.replaceTextRange([own ? lineStart(dot) : previous.range[1], call.range[1]],
                                                             (own ? '' : '\n') + pad(column) + shifted(source, dot.range[0], call.range[1], delta)),
                    })
                })
            },
        }
    },
}

// ── arc/callback-paren ───────────────────────────────────────────────────────

/**
 * The JSX a callback returns — a .map's, most often — opens with "(" on a line
 * of its own, in the column the callback starts at; the JSX goes one indent in
 * from there, and ")" closes in the "("'s column:
 *
 *     .map(action =>
 *          (
 *              <MenuItem key={action.key}>
 *          ))
 */
const callbackParen = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'The JSX a callback returns opens with "(" on its own line, under the callback.' },
        schema: [],
        messages: {
            paren: `Open this JSX with "(" on a line of its own, under the callback's first parameter (${DOC}, "A callback's JSX").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        return {
            ArrowFunctionExpression(node) {
                if (node.parent.type !== 'CallExpression' || !node.parent.arguments.includes(node)) return
                const body = node.body
                if (body.type !== 'JSXElement' && body.type !== 'JSXFragment') return
                const open = source.getTokenBefore(body)
                const close = source.getTokenAfter(body)
                if (open.value !== '(' || close.value !== ')' || open.loc.start.line === close.loc.end.line) return

                const column = source.getFirstToken(node).loc.start.column
                const at = (token, want) => startsLine(source, token) && token.loc.start.column === want
                if (at(open, column) && at(source.getFirstToken(body), column + INDENT) && at(close, column)) return
                const arrow = source.getTokenBefore(open)
                const commented = source.commentsExistBetween(arrow, body) || source.commentsExistBetween(body, close)
                context.report({
                    node: body,
                    messageId: 'paren',
                    fix: commented ? null : fixer => fixer.replaceTextRange([arrow.range[1], close.range[1]],
                                                                            '\n' + pad(column) + '('
                                                                            + '\n' + pad(column + INDENT)
                                                                            + shifted(source, body.range[0], body.range[1], column + INDENT - lineColumn(source, body))
                                                                            + '\n' + pad(column) + ')'),
                })
            },
        }
    },
}

// ── arc/attribute-object-close ───────────────────────────────────────────────

/**
 * An object written straight into an attribute — an sx, most often — that runs
 * over several lines closes with "}}" on a line of its own, under the "{{".
 */
const attributeObjectClose = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'A multi-line object attribute closes with "}}" on its own line, under the "{{".' },
        schema: [],
        messages: {
            close: `Close this object with "}}" on a line of its own, under the "{{" (${DOC}, "Attributes").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        return {
            JSXAttribute(node) {
                const object = objectValue(node)
                if (!object || object.loc.start.line === object.loc.end.line) return
                const outer = source.getFirstToken(node.value)
                const close = source.getLastToken(object)
                if (startsLine(source, close) && close.loc.start.column === outer.loc.start.column) return
                const own = startsLine(source, close)
                const previous = source.getTokenBefore(close, { includeComments: true })
                context.report({
                    loc: close.loc,
                    messageId: 'close',
                    fix: fixer => fixer.replaceTextRange([own ? lineStart(close) : previous.range[1], close.range[0]],
                                                         (own ? '' : '\n') + pad(outer.loc.start.column)),
                })
            },
        }
    },
}

// ── arc/member-spacing ───────────────────────────────────────────────────────

/** An interface, or an object type, of three or more members has a blank line between each. */
const memberSpacing = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'A blank line between the members of an interface of three or more.' },
        schema: [],
        messages: {
            blank: `Leave a blank line before this member: the interface has three or more (${DOC}, "Interfaces").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        const check = (members, around) => {
            if (members.length < 3 || around.loc.start.line === around.loc.end.line) return
            members.slice(1).forEach((member, index) => {
                const previous = members[index]
                if (previous.loc.end.line === member.loc.start.line) return
                const lead = source.getCommentsBefore(member).find(comment => comment.loc.start.line > previous.loc.end.line)
                if ((lead ?? member).loc.start.line - previous.loc.end.line >= 2) return
                const at = source.getIndexFromLoc({ line: previous.loc.end.line + 1, column: 0 })
                context.report({ node: member, messageId: 'blank', fix: fixer => fixer.insertTextBeforeRange([at, at], '\n') })
            })
        }
        return {
            TSInterfaceBody(node) {
                check(node.body, node)
            },
            TSTypeLiteral(node) {
                if (node.parent.type === 'TSTypeAliasDeclaration') check(node.members, node)
            },
        }
    },
}

// ── arc/attribute-per-line ───────────────────────────────────────────────────

/**
 * In a file that draws BUSY or more components, every attribute goes on a line
 * of its own, under the first; in a quieter file, attributes share a line while
 * it fits (reflow.py's 110 columns).
 */
const attributePerLine = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'In a busy file, every attribute on its own line.' },
        schema: [],
        messages: {
            line: `This file draws {{count}} components, so each attribute goes on a line of its own (${DOC}, "Attributes").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        const openings = []
        return {
            JSXOpeningElement(node) {
                openings.push(node)
            },
            'Program:exit'() {
                const count = openings.filter(node => isComponent(node.name)).length
                if (count < BUSY) return
                for (const node of openings) {
                    const [first, ...rest] = node.attributes
                    for (const attribute of rest) {
                        if (startsLine(source, attribute)) continue
                        const previous = source.getTokenBefore(attribute, { includeComments: true })
                        const column = first.loc.start.column
                        context.report({
                            node: attribute,
                            messageId: 'line',
                            data: { count },
                            fix: fixer => fixer.replaceTextRange([previous.range[1], attribute.range[1]],
                                                                 '\n' + pad(column)
                                                                 + shifted(source, attribute.range[0], attribute.range[1], column - attribute.loc.start.column)),
                        })
                    }
                }
            },
        }
    },
}

// ── arc/attribute-align ──────────────────────────────────────────────────────

/**
 * Wrapped attributes line up under the first. An object that starts beside its
 * "{" and then wraps — an sx, most often — puts each property on a line of its
 * own, under the first. Each is moved whole, so whatever is inside it keeps its
 * shape.
 */
const attributeAlign = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        docs: { description: 'Wrapped attributes, and a wrapped object\'s properties, line up under the first.' },
        schema: [],
        messages: {
            attribute: `Line this attribute up under the first (${DOC}, "Attributes").`,
            property: `Line this property up under the first (${DOC}, "Attributes").`,
            ownLine: `This object wraps, so give this property a line of its own, under the first (${DOC}, "Attributes").`,
        },
    },
    create(context) {
        const source = context.sourceCode
        const align = (items, opener, messageId, ownLines = false) => {
            const [first, ...rest] = items
            if (!first || rest.length === 0 || first.loc.start.line !== opener.loc.end.line) return
            const column = first.loc.start.column
            rest.forEach((item, index) => {
                if (ownLines && !startsLine(source, item)) {
                    const previous = source.getTokenBefore(item, { includeComments: true })
                    context.report({
                        node: item,
                        messageId: 'ownLine',
                        fix: fixer => fixer.replaceTextRange([previous.range[1], item.range[1]],
                                                             '\n' + pad(column) + shifted(source, item.range[0], item.range[1], column - item.loc.start.column)),
                    })
                    return
                }
                if (!startsLine(source, item) || item.loc.start.column === column) return
                // Comments on the lines above the item move with it.
                const previous = index === 0 ? first : rest[index - 1]
                const lead = source.getCommentsBefore(item).find(comment => comment.loc.start.line > previous.loc.end.line
                                                                             && startsLine(source, comment)) ?? item
                const delta = column - item.loc.start.column
                context.report({
                    node: item,
                    messageId,
                    fix: fixer => fixer.replaceTextRange([lineStart(lead), item.range[1]],
                                                         pad(lead.loc.start.column + delta) + shifted(source, lead.range[0], item.range[1], delta)),
                })
            })
        }
        return {
            JSXOpeningElement(node) {
                align(node.attributes, node.name, 'attribute')
            },
            ObjectExpression(node) {
                // An object that starts beside its "{" and then wraps: a column of properties.
                const open = source.getFirstToken(node)
                if (node.loc.start.line !== node.loc.end.line) align(node.properties, open, 'property', true)
            },
        }
    },
}

// ── The rules ─────────────────────────────────────────────────────────────────

export const layoutRules = {
    'brace-own-line': braceOwnLine,
    'literal-own-line': literalOwnLine,
    'statement-below': statementBelow,
    'ternary-lines': ternaryLines,
    'jsx-child-spacing': jsxChildSpacing,
    'chain-per-line': chainPerLine,
    'callback-paren': callbackParen,
    'attribute-object-close': attributeObjectClose,
    'member-spacing': memberSpacing,
    'attribute-per-line': attributePerLine,
    'attribute-align': attributeAlign,
}

// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.

const pad = count => ' '.repeat(Math.max(0, count))

/**
 * The shared check for anything that opens like a block: an opener that spans
 * lines must start its line, in the column its closer starts in.
 */
function checkOpener(context, open, close, ownLine = 'ownLine') {
    const source = context.sourceCode
    if (!open || !close || open.loc.start.line === close.loc.end.line) return
    const closeStarts = startsLine(source, close)
    if (startsLine(source, open)) {
        if (!closeStarts || open.loc.start.column === close.loc.start.column) return
        context.report({
            loc: open.loc,
            messageId: 'column',
            fix: fixer => fixer.replaceTextRange([lineStart(open), open.range[0]], pad(close.loc.start.column)),
        })
        return
    }
    const previous = source.getTokenBefore(open, { includeComments: true })
    const column = closeStarts ? close.loc.start.column : indentOf(source, open.loc.start.line)
    context.report({
        loc: open.loc,
        messageId: ownLine,
        fix: fixer => fixer.replaceTextRange([previous.range[1], open.range[0]], '\n' + pad(column)),
    })
}

/** Whether nothing but indentation comes before this token or node on its line. */
function startsLine(source, item) {
    const { line, column } = item.loc.start
    return source.lines[line - 1].slice(0, column).trim() === ''
}

/** The indentation of a line, in columns. */
function indentOf(source, line) {
    return source.lines[line - 1].match(/^ */)[0].length
}

/** The column a token starts at, or the line's indentation if it does not start the line. */
function lineColumn(source, token) {
    return startsLine(source, token) ? token.loc.start.column : indentOf(source, token.loc.start.line)
}

/** Where the line holding this token or node starts, as an index into the text. */
function lineStart(item) {
    return item.range[0] - item.loc.start.column
}

/** The "{" that a "}" closes. */
function matchingOpen(source, closing) {
    const node = source.getNodeByRangeIndex(closing.range[0])
    return node ? source.getFirstToken(node) : null
}

/** An expression with its `as` or `satisfies` taken off. */
function unwrapType(node) {
    while (node && (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression')) node = node.expression
    return node
}

/**
 * The text from `start` to `end` with every line after the first moved by
 * `delta` columns — except a line that starts inside a template literal, whose
 * leading spaces are part of the string.
 */
function shifted(source, start, end, delta) {
    const text = source.text.slice(start, end)
    if (delta === 0) return text
    const templates = templateRanges(source)
    let at = start
    return text.split('\n').map((line, index) => {
        const lineAt = at
        at += line.length + 1
        if (index === 0) return line
        if (templates.some(([from, to]) => from < lineAt && lineAt < to)) return line
        if (line.trim() === '') return ''
        if (delta > 0) return pad(delta) + line
        return line.slice(Math.min(-delta, line.match(/^ */)[0].length))
    }).join('\n')
}

const TEMPLATES = new WeakMap()

/** Where each piece of template literal text is, so a shift can leave it alone. */
function templateRanges(source) {
    if (!TEMPLATES.has(source)) TEMPLATES.set(source, source.ast.tokens.filter(token => token.type === 'Template').map(token => token.range))
    return TEMPLATES.get(source)
}

/** A call that is a link in a longer chain, rather than the chain's last call. */
function isInnerChainCall(node) {
    let current = node
    while (current.parent && (current.parent.type === 'ChainExpression' || current.parent.type === 'TSNonNullExpression')) current = current.parent
    const member = current.parent
    return member?.type === 'MemberExpression' && member.object === current
           && member.parent?.type === 'CallExpression' && member.parent.callee === member
}

/** The object written straight into an attribute, `sx={{ … }}`; null for anything else. */
function objectValue(attribute) {
    const value = attribute.value
    return value?.type === 'JSXExpressionContainer' && value.expression.type === 'ObjectExpression' ? value.expression : null
}

/** A component's tag — `<DayCard>`, `<Menu.Item>` — rather than an element's, `<div>`, `<path>`. */
function isComponent(name) {
    return name.type === 'JSXMemberExpression' || (name.type === 'JSXIdentifier' && /^[A-Z]/.test(name.name))
}
