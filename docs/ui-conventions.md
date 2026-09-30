# UI conventions

Written down because the code was inconsistent about them, and an unwritten
convention is one nobody can follow. Most are checked, not just written down:
`npm run check` runs the type checker, ESLint with this project's own rules, and
the formatter. See "What checks it" at the end. The API's C# has conventions of
its own, in `csharp-conventions.md`.

---

## File naming

The name matches the file's primary export, and its case says what kind of
thing that is.

| kind | case | example |
|---|---|---|
| Component | `PascalCase.tsx` | `BoardCard.tsx`, `ArcOverlay.tsx` |
| Hook | `camelCase.ts`, named for the hook | `useBoardActions.ts`, `useCardDrag.ts` |
| Module of related helpers | `Feature.Thing.ts` | `Board.Store.ts`, `CardGrid.Cells.ts` |
| Module that belongs to no feature | `PascalCase.ts` in `Styles/` or `Lib/`, named for what it holds | `Palette.ts`, `Fonts.ts`, `Client.ts` |

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

`main.tsx` is Vite's entry point and exports nothing. Checked by
`arc/file-named-for-export`, which leaves out the dotted modules, `Styles/`,
`Lib/` and `main.tsx`.

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

**Types may sit above it.** A component's `Props`, a store's `State`, an API
module's wire shapes: these describe the file's public surface and are what a
reader wants first, whether or not they are exported. The rule is about runtime
helpers and constants.

**One hazard this introduces.** `function` declarations hoist, so a function at
the bottom can be called by one above it. `const` does **not** — a `const`
declared at the bottom and read during module evaluation throws. It is fine
when only called at runtime, which is the normal case, but a constant used by a
top-level initialiser has to stay above its use. `Client.ts`'s `BASE_URL`, read
by a top-level `if`, is one.

Checked by `arc/private-last`. It knows both exceptions: types are never
reported, and a `const` or `class` is left above the banner when something
above the banner reads it while the module is evaluated. It also reports an
export that has ended up below the banner.

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

### What catches the formatting

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

Four modules hold values that more than one component depends on, and a
component may not restate one of them:

| module | holds |
|---|---|
| `Styles/Measures.ts` | every size that is not board geometry, and the `rem` helper |
| `Styles/Fonts.ts` | the font stacks |
| `Features/Board/Board.Layout.ts` | column widths, gaps, cell heights |
| `Features/Calendar/Calendar.Layout.ts` | the month grid's gap, a day's height, notes per day |

A value written inline at each use does not stay one value. The font stacks are
what proved it: the column headers fell back through three condensed faces while
the swimlane labels beside them fell straight to `sans-serif`, so on a machine
without Calibri Condensed the two halves of the same grid were set in different
fonts — and the monospace stack existed in two versions for the same reason,
whichever the nearest file happened to have when the next one was written.

The test for whether something belongs in one of these: would two files
disagreeing about it be a bug? A fallback chain, a column width and a dialog's
width all fail that test. A one-off `gap: 1` does not.

Fonts are checked: `arc/fonts-from-fonts` reports any `fontFamily` written as a
string outside `Styles/Fonts.ts`, `'inherit'` apart. `Fonts.ts` holds `CONDENSED`,
`MONO`, `NUMERALS`, `SCRIPT` and `SERIF`. A new stack is added there, then
imported.

---

## Materials

Everything on screen is one of three materials, and which one it is decides how
it is lit. Check a new component against this before styling it.

| material | what it is | lit by |
|---|---|---|
| **Glass** | the window, recesses in it, the board's columns | a translucent film, blur, and a bright rim — glass is the one material that should catch a highlight |
| **Card** | panels, labels, task rows, the board's swimlanes | a soft shadow straight down, and its **thickness**: a band of its own hue, darker, along the bottom edge |
| **Paper** | the notes on the board | a shadow tight at the top and longer at the bottom, where a note lifts |

Two things card must never have, both reported as making it look fake:

- **An outline.** A drawn ring is what a diagram does to a shape. Real card has
  no line round it, only the place where one sheet ends and whatever is under it
  begins.
- **A white line along the top.** Even softened, it reads as a specular
  highlight — glass and plastic, not card.

A piece **laid on another piece** — a tile on a day's header sheet, a chip on a
panel, a button on the bar — is `.card-cut`, worn with `.card-stock-flat`: the
short, crisp shadow each layer of the cut-paper pictures casts on the one
behind it, rather than the softer lift of a strip standing off its panel. It is
what makes a stack read as cuts of paper on paper.

### The palette

Every colour with a hue is a step of one of four ladders, written down once in
`src/Styles/Palette.ts` and set on `:root` as custom properties
(`--arc-blue-ground`, `--arc-gold`, …) for `ArcStyles.css` to cut its stocks
from. Each ladder is three steps of one hue, measured in OKLCH so a step is the
same lightness whichever hue it is on:

| hue | ground (L ≈ .90) | mid (L ≈ .72) | deep (L ≈ .40) |
|---|---|---|---|
| blue | `#cfdfef` `.paper-blue` | `#79aad8` `.paper-ink` | `#295074` `.paper-navy` |
| green | `#cfe6dc` `.paper-green` | `#6cb69a` `.paper-sage` | `#175a45` `.paper-forest` |
| red | `#f1cac3` `.paper-red` | `#d59185` `.paper-rose` | `#70322b` `.paper-oxblood` |
| yellow | `#ecdca6` `.paper-yellow` | `#cfac5f` `.paper-gold` | `#5c4b14` |

Roughly 60 / 30 / 10: mostly grounds, some mids, the deeps as accents. Gold is
the yellow mid and oxblood the red deep — they were the two colours outside the
family (gold about twice as saturated as any stock, oxblood the only dark), and
on the ladders each has one. The neutrals — cream card, sand lanes, greyboard,
the notes' pale yellow — sit beside the ladders with almost no hue.

What goes where:

- **Grounds** are panels and tiles: the paper you read things on.
- **Mids** hold their own at a few pixels wide: rails, a node with a date, the
  deepest column header, the swimlane ramp's strongest label.
- **Deeps** anchor a page and carry gold, with cream text: the app bars (navy),
  today's date and a view's name (oxblood), snackbars (by meaning). The bars
  are the one place a deep is flat colour rather than card — on a strip that
  dark the grain read as speckle — and their controls are pieces of cream card
  laid on them (`.app-bar`, `.bar-piece`).
- **On glass**, the actions use grounds, since only a light colour reads there:
  Save in the yellow ground, Delete in a red just past its ground.

A stock sets only `--arc-paper`; its lit face is worked out from that colour
(`oklch(from …)`), so a new stock is one line. The column and swimlane ramps
run between a ladder's ground and mid. The colour picker offers every ground
and mid as a chip of card, then the colours someone has saved (kept in the
browser), and the full picker in a popover behind "Mix…". Chart colours are the
one exception — see "Chart colour".

Checked by `arc/colours-from-palette`: outside `Styles/`, a hex colour, or an
`rgb()` whose channels are more than 40 apart (a colour with a hue, not a grey
or a shadow), is reported. Take it from `Palette.ts`, `Scenery.ts`, a
`var(--arc-…)` property or a theme token instead. `Calendar.Stats.ts`, home of
the chart palette, is the one file outside `Styles/` it leaves alone.

The cut-paper pictures — the day types' scenes and the lanes' waves —
draw from the same ladders, by name, through `src/Styles/Scenery.ts`, and share
one frame, `Components/PaperScene.tsx`: flat shapes, each casting the same
small shadow on the one behind. Nothing in a picture is a hue the rest of the
app does not have.

### The board

Glass, card, glass, paper — back to front. The board is a window; each swimlane
is a strip of sand card laid across it, with the window showing in the gaps
between lanes; each column is a strip of frosted glass laid over all of it, top
to bottom; notes sit on top. So the two axes of the board are two materials:
you can tell a column from a lane by what it is made of, not only by which way
it runs.

Along the foot of every lane runs a strip of cut-paper water — a swim lane —
crisp beside the label and frosted wherever a column's glass crosses it (see
`Features/Board/LaneWaves.tsx`). The corner above the labels is left empty for
now; "Honu Boards" is in the navy bar, in gold foil, where it has room for one
line and still shows on a phone.

### The calendar

Glass, then paper — the Blazor calendar's own arrangement, not the board's.
Each day is a pane of frosted glass of its own, laid straight on the page with
no pane round the month and nothing behind the days: glass seen through glass
was fog. The slots before the 1st and after the last day are empty — the
neighbouring months' days are not drawn, because drawn the same way they read
as part of this month. The weekday names are paper tiles: blue for the working
days, red for the weekend.

Across the top of a day is a header of tiles — a tablet start screen, cut from
card, each tile its own colour, laid on a sheet of sand card with a hairline of
the sheet showing between them. Each tile, the date's disc and its ring cast
the cut shadow (`.card-cut`) on the sheet; the sheet casts its own on the day's
glass, which still shows between the header and the cards under it:

| tile | stock | what it is |
|---|---|---|
| the date | a card disc, ringed | the number in gold foil, as large as the disc takes — every day at the size at which the widest date's figures all but touch its edge (`DiscNumber`); ringed with its tasks by type; the disc fills the ring to its inner edge; today is oxblood |
| middle | cream | the progress lines (no count in the corner), the day type's picture, or "+ Add card" — see below |
| ⋮ | yellow | quick actions |
| ‹ › | blue | step through the day's views; not drawn on a day with no cards |
| heading | oxblood | the view's name in gold foil, four capitals at most — ALL, OPEN, FEAT |

How the tiles arrange is decided by the day's own width (a container query),
not the window's, because the same day is also drawn as a live copy inside its
overlay. Under the header, the view's cards, each a note wrapped round its tasks
as green strips — the same strips, and the same popover behind them, as in the
card editor. The views are a list in `Calendar.Views.ts`; the charts' numbers
and colours are in `Calendar.Stats.ts`.

No day draws a graph of nothing. The middle tile is the lines only where there
is progress to show and the day's type measures it; otherwise it is the type's
picture, or an offer to add a card (or a task, to a day whose cards have none).

### Day types

A day has a type, and the type has a picture — a scene in cut paper, drawn by
`DayArt.tsx` from the palette's ladders. The types are fixed, in `Calendar.DayTypes.ts`; the API stores
only the number.

| type | picture | ring | lines | an empty day shows |
|---|---|---|---|---|
| no theme | — | yes | yes | "+ Add card" |
| Work | a city | yes | yes | "+ Add card", on a chip over the skyline |
| Leisure | a park | yes | no — the picture | the picture |
| Vacation | a beach | no | no — the picture | the picture |

The picture is how the type is changed: click it at the top of the day
overlay, or use the Theme items in a day's ⋮. On a phone, where a day has no
header, it is a strip along the day's foot, and the date's disc sits on a scrap
of the same sand sheet. Leisure and Vacation are not
working days, so work carried over from the day before steps past them.

**Gold** is `.gold-foil`: Blazor's `.gold-text` gradient, re-cut from the
yellow ladder (see "The palette"), with a dark drop-shadow under it so the
letters keep an edge on light card. It reads best on the deeps — today's date on
oxblood, the month and "Honu Boards" on the navy bars.

### Chart colour

The one set of colours not on the ladders. Four soft hues cannot tell eight
types apart at a glance, so the charts keep a categorical palette of their own.

A task type's colour is its slot in the eight-hue categorical palette, taken
from the app's whole type list in ID order — never from what is on one day, so
a type is the same colour everywhere. Untyped tasks are grey. The palette was
validated against the frosted sand a day sits on; five hues are under 3:1 there,
so colour is never the only way to tell a type: the day overlay lists every
type by name with its count, and each task row carries its type's mark and name.

### The day overlay

Laid out the way the Blazor one was: along the top, the number, the date in
words, the type's picture and the tags; under them the timeline, which is the
bulk of it, and the cards; down the right, a slim column of frosted glass with
the day as the calendar shows it — exactly: the grid day's own width and
height, measured (`useGridDaySize`), so its layout is the grid's too — the
table of types, and the day's
connections — the days either side, its cards' boards, other days with the same
cards, and the days its tasks are due. Every day in it opens in the same
overlay, crossing into another month if it has to. A panel with nothing in it
is not drawn.

The timeline's label is sage, the green ladder's mid — the one stock nothing
else in the day view is cut from. The timeline does not mark the day itself:
the panel is already the day's, so its own stops are at full strength and
stops on other days are paler and carry their date.

---

## Two grounds, two ramps

An overlay has exactly two kinds of surface, and which one a component is
standing on decides every colour it paints.

| ground | what it is | class | text ramp |
|---|---|---|---|
| Glass | the pane, and recesses cut into it | `.glass`, `.glass-inner-engraved` | `arc.onGlass*`, `arc.glass*` |
| Card stock | a piece of board resting on the pane | `.card-stock`, `.card-stock-flat` | `arc.onPaper*`, `arc.paper*` |

Glass is dark, so everything on it is a white at some opacity. Card is light,
so everything on it is a warm near-black at some opacity. **Neither ramp
degrades into the other**: `onGlassMuted` is a 60% white, which on card stock is
invisible, and `onPaperMuted` on glass is unreadable. Mixing them does not look
slightly wrong, it looks broken — the first render of the card panels struck a
completed task's title through and then made the title disappear, because the
strike had kept its on-glass colour.

So when a panel changes ground, every colour in it changes with it. There is no
shortcut, and a token that "looks close enough" on both is a token that is
wrong on both.

### A component that cannot see its ground must be told

`ArcPopover` marks its trigger while the popover is open. A marker is a change
in *contrast*, and which direction contrast goes depends on what is underneath —
the task rows are card, so theirs darkens; "+ New task" sits on the glass tray,
so its lightens. The component cannot see what it was rendered onto, so it
keeps only the half that holds either way (the accent bar and the weight) and
takes the rest from the caller as `triggerOpenSx`.

It used to guess, with a white fill and a 95% white label. That was right for
the one ground that existed at the time.

---

## C# style is not carried across

The API is written with a space before the parameter list —
`ParentExistsAsync (Guid parentID, ...)` — and that is right for C#, where it
is consistent throughout. TypeScript here does not use it, and should not start:
every tool in the JS ecosystem assumes `foo(bar)`, and mixing the two inside one
repository is worse than either.

Naming likewise: C# `PascalCase` methods, TypeScript `camelCase` functions.
The boundary is the language, not the repository. Checked, and fixable, by
`arc/no-space-before-paren`. The C# side is written down in
`csharp-conventions.md` and checked by `tools/check-csharp.mjs`.

---

## What checks it

From `arcstrides.ui/`:

```
npm run check     # everything below, in order; exit 1 on the first failure
npm run lint      # ESLint alone
npm run format    # rewrite what the formatter would complain about
```

`npm run check` is the type checker (`tsc -b`), the tests for this project's
own ESLint rules, ESLint, and `reflow.py --check`. The rules are in
`tools/eslint-arc.js`, and each message names the section of this page it
enforces:

| rule | section |
|---|---|
| `arc/file-named-for-export` | File naming |
| `arc/private-last` | Member ordering |
| `arc/no-space-before-paren` | C# style is not carried across |
| `arc/fonts-from-fonts` | Shared values live in a module |
| `arc/colours-from-palette` | The palette |
| `no-restricted-imports` (configured in `eslint.config.js`) | the layers: Pages and Layouts over Features over Entities over Components and Lib |

A deliberate exception is an `// eslint-disable-next-line arc/…` with a comment
saying why. None of the `arc/` rules has one today.

What it does not check: the materials, the two grounds and their ramps, and
anything else about how a thing looks. Those need someone looking at the
screen, and this page is what they check it against.
