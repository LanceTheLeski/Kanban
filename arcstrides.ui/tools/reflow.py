#!/usr/bin/env python3
"""
reflow.py — applies the JSX layout rules in docs/ui-conventions.md.

    python3 tools/reflow.py            # rewrite every .tsx under src/
    python3 tools/reflow.py --check    # exit 1 if anything is out of shape
    python3 tools/reflow.py a.tsx b.tsx

Three rules, in the order they are applied:

  1. An element whose attributes wrap puts the first attribute on the tag's own
     line and aligns the rest under it.
  2. An `sx={{ ... }}` object follows the element's alignment rather than
     starting a new indent level.
  3. Anything that fits stays on one line — so an sx that no longer fits, once
     rule 1 has pulled it up beside the tag, is broken into that same column.

Prettier cannot produce any of them, and the conventions doc named the cost of
that: hand-aligned columns drift when an attribute is renamed, and nothing
catches it. This is what catches it. `--check` is the form to run in CI.

── How it reads the source ──────────────────────────────────────────────────
Everything works off a mask of what is real code. An earlier version scanned
braces and quotes inline and got two files wrong: a `//` comment holding an
apostrophe opened a string that swallowed the matching `}`, and a comment
trailing an sx block's last property took the closing `}}` with it. Deciding
once, in one pass, what is comment and what is string removes both.

Each block is moved by a single delta, so a comment inside one keeps whatever
shape it had — a `*` column, a hanging indent, or neither — and blank lines are
kept, because one inside a comment is a paragraph break and one between
property groups is the only thing separating them.

Two things are deliberately left alone: an element whose attributes contain a
multi-line template literal, since shifting it would edit the string rather
than the layout, and an sx object whose last property carries a trailing
comment, since the closing `}}` has nowhere to go. Both are rare, and both are
better fixed by hand than by a rule.
"""
import re
import sys
import pathlib

QUOTES = "'\"`"
WIDTH = 110

TAG = re.compile(r'<([A-Za-z][\w.]*)[ \t]*\n')
BLOCK_SX = re.compile(r'^(?P<indent>[ \t]*)(?P<lead>.*?)(?P<prop>sx)=\{\{[ \t]*$', re.M)
INLINE_SX = re.compile(r'^(?P<indent>[ \t]*)(?P<lead>.*?)(?P<prop>sx)=\{\{ ', re.M)


def reflow(src):
    """Applies every rule until the text stops changing."""
    for rule in (reflow_tags, align_sx, split_wide_sx):
        while True:
            src, again = rule(src)
            if not again:
                break
    return src


def reflow_tags(src):
    """Rule 1. One element per call, because each rewrite moves what follows."""
    for match, mask in matches(src, TAG):
        tag, lt = match.group(1), match.start()
        close = find_tag_end(src, mask, match.end())
        if close == -1:
            continue

        line_start = src.rfind('\n', 0, lt) + 1
        if src[line_start:lt].strip():
            continue                # something shares the line; not ours to align

        self_closing = src[close - 1] == '/'
        body_end = close - 1 if self_closing else close
        if crosses_lines(src, mask, match.end(), body_end):
            continue

        lines = trimmed(src[match.end():body_end])
        if not lines:
            continue

        column = lt - line_start
        moved = realign(lines, column + len('<' + tag + ' '))
        rebuilt = '<' + tag + ' ' + moved + (' />' if self_closing else '>')
        return src[:lt] + rebuilt + src[close + 1:], True
    return src, False


def align_sx(src):
    """Rule 2. One object per call, for the same reason."""
    for match, mask in matches(src, BLOCK_SX, 'prop'):
        inner_end = find_brace_end(src, mask, src.index('{{', match.start()) + 1)
        if inner_end == -1 or crosses_lines(src, mask, match.end(), inner_end):
            continue
        if ends_in_comment(src, mask, match.end(), inner_end):
            continue

        lines = trimmed(src[match.end():inner_end])
        if not lines:
            continue

        head = sx_head(match)
        moved = realign(lines, len(head)).rstrip(',')
        return src[:match.start()] + head + moved + ' }}' + src[inner_end + 2:], True
    return src, False


def split_wide_sx(src):
    """Rule 3. One line per call."""
    for match, mask in matches(src, INLINE_SX, 'prop'):
        line_end = src.find('\n', match.start())
        line_end = len(src) if line_end == -1 else line_end
        if line_end - match.start() <= WIDTH:
            continue

        inner_end = find_brace_end(src, mask, src.index('{{', match.start()) + 1)
        if inner_end == -1 or inner_end > line_end:
            continue                # already broken across lines; rule 2 has had it

        parts = split_properties(src[match.end():inner_end].rstrip(), mask, match.end())
        if len(parts) < 2:
            continue

        head = sx_head(match)
        joined = (',\n' + ' ' * len(head)).join(parts)
        return src[:match.start()] + head + joined + ' }}' + src[inner_end + 2:], True
    return src, False


def main(argv):
    check = '--check' in argv
    given = [a for a in argv if not a.startswith('-')]
    root = pathlib.Path(__file__).resolve().parent.parent
    paths = [pathlib.Path(a) for a in given] or sorted((root / 'src').rglob('*.tsx'))

    out_of_shape = []
    for path in paths:
        before = path.read_text()
        after = reflow(before)
        if after == before:
            continue
        out_of_shape.append(path)
        if not check:
            path.write_text(after)

    verb = 'out of shape' if check else 'reflowed'
    for path in out_of_shape:
        print(f'{verb}: {path}')
    if not out_of_shape:
        print(f'{len(paths)} files already follow the conventions.')
    return 1 if (check and out_of_shape) else 0


# ── Private ───────────────────────────────────────────────────────────────────
# Not exported; ordered by first use above.


def matches(src, pattern, group=0):
    """Matches that start in real code, against a mask of the current text."""
    mask = code_mask(src)
    pos = 0
    while True:
        match = pattern.search(src, pos)
        if not match:
            return
        pos = match.end()
        if mask[match.start(group)]:
            yield match, mask


def code_mask(src):
    """1 at every index that is code — not a comment, not a string."""
    mask = bytearray(b'\x01' * len(src))
    i, n = 0, len(src)
    while i < n:
        pair = src[i:i + 2]
        if pair == '//':
            j = src.find('\n', i)
            j = n if j == -1 else j
        elif pair == '/*':
            j = src.find('*/', i + 2)
            j = n if j == -1 else j + 2
        elif src[i] in QUOTES:
            j = end_of_string(src, i)
        else:
            i += 1
            continue
        mask[i:j] = b'\x00' * (j - i)
        i = j
    return mask


def end_of_string(src, start):
    quote, n = src[start], len(src)
    i = start + 1
    while i < n:
        if src[i] == '\\':
            i += 2
            continue
        if src[i] == quote:
            return i + 1
        i += 1
    return n


def find_tag_end(src, mask, start):
    """From just after `<Tag`, the index of the `>` that closes the open tag."""
    depth = 0
    for i in range(start, len(src)):
        if not mask[i]:
            continue
        char = src[i]
        if char in '([{':
            depth += 1
        elif char in ')]}':
            depth -= 1
        elif depth == 0 and char == '>':
            return i
        elif depth == 0 and char == '<':
            return -1           # a nested element; not ours to walk
    return -1


def crosses_lines(src, mask, start, end):
    """Whether a string in [start, end) spans lines, carrying its own indent."""
    i = start
    while i < end:
        if mask[i]:
            i += 1
            continue
        run = i
        while run < end and not mask[run]:
            run += 1
        if src[i] != '/' and '\n' in src[i:run]:
            return True
        i = run
    return False


def trimmed(body):
    """The body's lines, without the blank ones at either end."""
    lines = body.split('\n')
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return lines


def realign(lines, column):
    """Moves a block to a new column, keeping everything inside it in shape."""
    delta = column - (len(lines[0]) - len(lines[0].lstrip(' ')))
    moved = [shift(line, delta) for line in lines]
    moved[0] = moved[0].lstrip(' ')
    return '\n'.join(moved).rstrip()


def shift(line, delta):
    if not line.strip():
        return ''
    if delta >= 0:
        return ' ' * delta + line
    return line[min(-delta, len(line) - len(line.lstrip(' '))):]


def find_brace_end(src, mask, open_brace):
    """The index of the `}` matching the `{` at open_brace."""
    depth = 0
    for i in range(open_brace, len(src)):
        if not mask[i]:
            continue
        if src[i] == '{':
            depth += 1
        elif src[i] == '}':
            depth -= 1
            if depth == 0:
                return i
    return -1


def ends_in_comment(src, mask, start, end):
    """Whether the object's last property line carries a trailing comment."""
    i = end - 1
    while i > start and src[i].isspace():
        i -= 1
    line_start = src.rfind('\n', 0, i) + 1
    line_end = src.find('\n', i)
    return any(not mask[j] and src[j:j + 2] in ('//', '/*')
               for j in range(line_start, line_end))


def sx_head(match):
    return match.group('indent') + match.group('lead') + match.group('prop') + '={{ '


def split_properties(body, mask, offset):
    """The object's own commas, not the ones inside its values."""
    parts, depth, start = [], 0, 0
    for i, char in enumerate(body):
        if not mask[offset + i]:
            continue
        if char in '([{':
            depth += 1
        elif char in ')]}':
            depth -= 1
        elif char == ',' and depth == 0:
            parts.append(body[start:i])
            start = i + 1
    parts.append(body[start:])
    return [part.strip() for part in parts if part.strip()]


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
