# UI conventions

Written down because the code was inconsistent about all three of these, and an
unwritten convention is one nobody can follow.

---

## File naming

The name matches the file's primary export, and its case says what kind of
thing that is.

| kind | case | example |
|---|---|---|
| Component | `PascalCase.tsx` | `BoardCard.tsx`, `ArcOverlay.tsx` |
| Hook | `camelCase.ts`, named for the hook | `useBoardActions.ts`, `useCardDrag.ts` |
| Module of related helpers | `Feature.Thing.ts` | `Board.Store.ts`, `CardGrid.Cells.ts` |

The third case is the one that had drifted. A module has no single primary
export to be named after, so it takes the feature it belongs to plus what it
holds, dotted. That is what `Board.APIs.ts`, `Board.Layout.ts` and
`Board.Types.ts` were already doing; `cardSensors.ts` and `timelineDraft.ts`
were not, for no reason other than the order they were written in. They are now
`CardGrid.Sensors.ts` and `Timeline.Draft.ts`.

Hooks stay camelCase deliberately. The file is named after its export like
every other file here, and the export is `useCardDrag` — React's own convention
requires the `use` prefix, and matching the file to it is what makes the import
line read the same as the call.

---

## Member ordering

Public first, in the order a reader meets them. Private last, in the order they
are first referenced above — or, when one is clearly the workhorse, by
relevance.

"Private" in a module is **not exported**. There is no keyword; the absence of
`export` is the whole of it, and it is as strong as `private` in C# — nothing
outside the file can name it. A file-scoped helper like
`beganOnInteractiveElement` is private in every sense that matters, and moving
it to the bottom is not against any React convention. React has opinions about
components and hooks; it has none about where a module puts its helpers.

Mark the boundary so it is not accidental:

```ts
// ── Private ───────────────────────────────────────────────────────────────────
// Not exported, which is this language's `private`. Ordered by first use above.
```

**One hazard this introduces.** `function` declarations hoist, so a function at
the bottom can be called by one above it. `const` does **not** — a `const`
declared at the bottom and read during module evaluation throws. It is fine
when only called at runtime, which is the normal case, but a constant used by a
top-level initialiser has to stay above its use.

---

## Formatting

### Arguments and attributes never start on a new line

The first one goes on the same line as the thing that takes it; the rest align
under it.

```tsx
<TextField value={title}
           onChange={event => setTitle(event.target.value)}
           variant="outlined"
           placeholder="Card title"
           size="small" />
```

Not this, which is Prettier's default and what most of this code was doing:

```tsx
<TextField
    value={title}
    onChange={event => setTitle(event.target.value)}
/>
```

The reason is that the second form hides the tag name in a line of its own and
puts the first thing you want to read a line below where you are looking. With
the first form the element and its most important attribute read as one phrase,
and the alignment makes the attribute list a column you can scan.

The same holds for a call or a signature that has to wrap:

```ts
export const entity = (value: string,
                       kind?: CardCommandSpan['kind']): CardCommandSpan =>
    ({ entity: value, kind })
```

An `sx` object follows the element's alignment rather than starting a new
indent level:

```tsx
<Paper className="glass-inner-engraved"
       sx={{ p: 1,
             display: 'flex',
             flexDirection: 'column' }}>
```

### What stays on one line

Anything that fits. Wrapping is for lines that would otherwise run long, not a
rule to apply to every element — `<Box sx={{ display: 'flex', gap: 1 }}>` is
one line and should stay one line.

"Fits" is 110 characters. An `sx` that goes past it once the first rule has
pulled it up beside its tag is broken into the same column the attributes use.

### Why this is not a Prettier config

Prettier cannot produce this. Its JSX output always puts the first attribute on
its own line once an element wraps, and that is not configurable. Adopting the
convention means Prettier cannot be run over these files.

That left a real cost, and this doc used to end by naming it: hand-aligned
columns drift when an attribute is renamed, and nothing would catch it.

### What catches it

`arcstrides.ui/tools/reflow.py` applies all three rules above.

```
npm run format          # rewrite every .tsx under src/
npm run format:check    # exit 1 if anything is out of shape
```

It reads the source through a mask of what is code and what is comment or
string, then moves each block by a single delta, so a comment inside one keeps
whatever shape it had and blank lines survive. Two things it deliberately will
not touch, because both are better judged by a person: an element whose
attributes hold a multi-line template literal, and an `sx` object whose last
property carries a trailing comment. Its own header says why.

The trade is still a trade — a project-specific script instead of an
off-the-shelf formatter — but the drift it was traded against is now caught.

---

## Shared values live in a module, not in the first file that needed them

Three modules hold values that more than one component depends on, and a
component may not restate one of them:

| module | holds |
|---|---|
| `Styles/Measures.ts` | every size that is not board geometry, and the `rem` helper |
| `Styles/Fonts.ts` | the font stacks |
| `Features/Board/Board.Layout.ts` | column widths, gaps, cell heights |

A value written inline at each use does not stay one value. The font stacks are
what proved it: the column headers fell back through three condensed faces while
the swimlane labels beside them fell straight to `sans-serif`, so on a machine
without Calibri Condensed the two halves of the same grid were set in different
fonts — and the monospace stack existed in two versions for the same reason,
whichever the nearest file happened to have when the next one was written.

The test for whether something belongs in one of these: would two files
disagreeing about it be a bug? A fallback chain, a column width and a dialog's
width all fail that test. A one-off `gap: 1` does not.

---

## C# style is not carried across

The API is written with a space before the parameter list —
`ParentExistsAsync (Guid parentID, ...)` — and that is right for C#, where it
is consistent throughout. TypeScript here does not use it, and should not start:
every tool in the JS ecosystem assumes `foo(bar)`, and mixing the two inside one
repository is worse than either.

Naming likewise: C# `PascalCase` methods, TypeScript `camelCase` functions.
The boundary is the language, not the repository.
