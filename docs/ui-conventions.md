# UI conventions

Written down because the code was inconsistent about them, and an unwritten
convention is one nobody can follow. Most are checked, not just written down:
`npm run check` runs the type checker, ESLint with this project's own rules, and
the formatter. See "What checks it" at the end. The API's C# has conventions of
its own, in `csharp-conventions.md`.

---

## Names say what a thing is

**Clear over concise.** A name says what the thing is and where it appears, in
words, with nothing to decode. `TaskTypeRingChart`, not `TypeRing`;
`DatePickerMonthStep`, not `MiniMonth`; `useCalendarBoards`, not `useBoards`.
A longer name costs a few characters at each use; a vague one costs a trip into
the file at each read. The same goes for comments: say what happens and why, in
sentences, rather than leaving the reader to reconstruct it.

This was the intent all along but was never written down here, and the calendar
grew a set of short names (`DayBand`, `TypeRing`, `DiscNumber`) that only made
sense to whoever wrote them. They were renamed together, with the folders below.

## File naming

The name matches the file's primary export, and its case says what kind of
thing that is.

| kind | case | example |
|---|---|---|
| Component | `PascalCase.tsx`, ending in its role | `BoardCardNote.tsx`, `DayTimelineList.tsx` |
| Hook | `camelCase.ts`, named for the hook, in a `Hooks/` folder | `Hooks/useBoardActions.ts` |
| Module of related helpers | `Feature.Thing.ts` | `Board.Store.ts`, `CardGrid.Cells.ts` |
| Module that belongs to no feature | `PascalCase.ts` in `Styles/` or `Lib/`, named for what it holds | `Palette.ts`, `Fonts.ts`, `Client.ts` |

A module has no single primary export to be named after, so it takes the
feature it belongs to plus what it holds, dotted: `Board.APIs.ts`,
`Board.Layout.ts`, `Timeline.Draft.ts`.

**Why a hook starts with a lower-case `use`.** A hook is a function, not a
component, so it is camelCase like any function. The `use` is React's own rule,
not this project's: React — and its lint rule, `react-hooks/rules-of-hooks` —
recognise a hook by a name beginning `use` and a capital letter, and only then
check that it is called at the top of a component, the same number of times on
every render. Named anything else, a hook would work and lose that check. The
file is named after the export, like every other file here, so the import line
reads the same as the call. What follows `use` is what it gives you:
`useCalendarBoards` gives the boards the calendar reads.

`main.tsx` is Vite's entry point and exports nothing; `App.tsx` is the root.
Checked by `arc/file-named-for-export`, which leaves out the dotted modules,
`Styles/`, `Lib/` and `main.tsx`.

### Roles

A component's name ends in what it is. A word before the role says which one:
`DayTimelineList` is the list on the day overlay's timeline, `GridDayCell` the
cell of one day on the month grid.

| role | is | example |
|---|---|---|
| Page | a route | `BoardPage`, `CalendarPage` |
| Layout | arranges other components and owns no content | `AppLayout`, `ArcSplitLayout` |
| View | the body a page shows | `MonthView` |
| Grid | a two-way arrangement of cells | `CardGrid`, `MonthGrid` |
| Overlay | a modal window over the page (`ArcOverlay`) | `DayOverlay`, `CreateCardOverlay` |
| Popover | a window anchored to what opened it (`ArcPopover`) | `UpdateTaskPopover`, `CreateTaskPopover` |
| Menu | a list of actions that drops down | `DayActionsMenu`, `AppMenu` |
| Bar | a strip of controls along an edge | `BoardNavBar`, `ArcActionBar` |
| Panel | a self-contained section of an overlay or a view, with its own heading | `DayHeaderPanel`, `UpdateTimelinePanel`, `TagsPanel` |
| Header | the top of something, holding its name and its controls | `GridDayHeader` |
| List | a list of entries | `DayTimelineList`, `PlacementList` |
| Row | one line of a grid or a list | `SwimlaneRow`, `ColumnHeaderRow` |
| Cell | one square of a grid | `GridDayCell`, `DroppableCell` |
| Note | a card, drawn as a paper note | `BoardCardNote`, `DayCardNote` |
| Node, Rail | a point on a timeline's rail, and the rail | `TimelineNode`, `TimelineRail` |
| Chart | draws numbers | `TaskTypeRingChart`, `TaskProgressLineChart` |
| Art | a picture, there to be looked at | `DayTypeSceneArt`, `LaneWavesArt` |
| Picker | a control that chooses a value | `ArcColourPicker`, `TimelineDatePicker` |
| Step | one stage of a picker | `DatePickerMonthStep`, `DatePickerTimeStep` |
| Number | a figure drawn to fit a shape | `DateDiscNumber` |
| Provider | puts a context or a service around its children | `ArcErrorProvider` |

A component inside a file, not exported — a `Section`, a `Chip` — is not held
to this; it is named for what it is in the file that uses it. A role the table
lacks is added to the table and to `ROLES` in `arcstrides.ui/tools/eslint-arc.js`
in the same commit, rather than worked around.

### Folders

A feature's files are grouped by where they appear. Its modules
(`Feature.Thing.ts`) stay at the feature's root, because the whole feature uses
them.

```
Features/Calendar/
  Calendar.APIs.ts  Calendar.Store.ts  Calendar.DayTypes.ts  …
  Month/       MonthView  MonthGrid  CalendarNavBar  CalendarCardOverlay
  GridDay/     one day on the grid: GridDayCell  GridDayHeader  DayCardNote
               DayActionsMenu  DateDiscNumber
  DayOverlay/  a day opened: DayOverlay, DayHeaderPanel, DayCardsPanel,
               DayTimelineList, DayConnectionsPanel, AddCardPicker,
               DayPreviewOverlay
  DatePicker/  under a timeline node: TimelineDatePicker, its two steps,
               DatePickerOrderList, CustomDurationPopover
  Options/     CalendarOptionsOverlay
  Charts/      TaskTypeRingChart  TaskProgressLineChart
  Assets/      DayTypeSceneArt
  Hooks/       useCalendarBoards  useBoardTitles  useAddableCards  useDayTypes
               useGridDaySize  usePickerMonth

Features/Board/
  Board.APIs.ts  Board.Store.ts  …  BoardNavBar
  Grid/        CardGrid  CardGrid.Cells.ts  CardGrid.Sensors.ts  BoardCardNote
               SwimlaneRow  ColumnHeaderRow  DroppableCell  DraggableCardNote
  Card/  Task/  Timeline/  Commands/  Column/  Swimlane/
  ColumnAndSwimlane/   what the column and swimlane overlays share:
               PlacementList  GlobalColourPanel
  Assets/      LaneWavesArt  ColumnGlassArt
  Hooks/       useBoardActions  useCardDrag  useColourChoice
```

**Art** — anything drawn to be looked at rather than read: the day types'
scenes, the lanes' waves, the columns' glass — lives in the feature's `Assets/`.
The frame every scene is drawn in, `ArcPaperSceneArt`, is shared and lives in
`Components/` with the other building blocks, each named `Arc` and its role.

Checked by `arc/component-role`: a component's file ends in a role from the
table, and inside a feature a hook sits in `Hooks/` and art in `Assets/`.

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

The banner is what `arc/private-last` reads. Without it, every helper below the
exports is reported as private-but-above, and the report lands on the whole
declaration, so a long `const` array looks as if it were broken. Keep the
two comment lines whenever a file has anything private.

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

## Layout

Written from Lance's own edits to `DayActionsMenu`, `MonthView` and
`Calendar.Context`, so the TypeScript reads the way the C# does: braces on
lines of their own, and one thing per line wherever a line would otherwise hold
two. Each rule below is an ESLint rule with a fixer (`tools/eslint-arc-layout.js`),
so `npm run format` puts a file into shape and `npm run check` keeps it there.

### Braces

A block that spans lines opens with `{` on a line of its own, in the column of
the `}` that closes it. `else`, `catch` and `finally` start the line after that
`}`. It holds for every block: functions, arrows, `if`, `try`, interfaces,
classes, and the arrow inside an attribute.

```tsx
const handleAddCard = async (day: GridDay, card: Card) =>
{
    try
    {
        await addCard(day.date.date(), card)
    }
    catch (error)
    {
        addError(`Could not put "${card.title}" on ${day.date.format('D MMMM')}: ${messageOf(error)}`)
    }
}
```

An object or array that spans lines and is returned by an arrow, or held by a
declaration, opens the same way:

```tsx
const ACTIONS: DayAction[] =                 const actions = useMemo<CalendarActions>(() =>
[                                            ({
    { key: 'add', … },                           colours,
]                                                …
                                             }), [colours, …])
```

A block that fits on one line stays on it: `taskUpdated: () => { refresh() }`.

Checked by `arc/brace-own-line` and `arc/literal-own-line`.

### One-statement bodies

As in the C#: an `if`, `else`, `for` or `while` whose body is one statement,
without braces, puts it on the next line, one indent in.

```ts
if (!actions)
    throw new Error('useCalendarActions is only for components inside MonthView.')
```

Inside a block that fits on one line, it stays where it is:
`onClose={() => { if (open) close() }}`. Checked by `arc/statement-below`.

### Ternaries

Every ternary goes on three lines, inline ones included. The `?` and the `:`
each start a line, one indent in from where the line holding the condition
starts. When the ternary sits in an attribute or a property that starts later
on that line, the indent is counted from the attribute or property instead.

```tsx
return error instanceof Error             sx={{ ml: 1.5,
    ? error.message                             visibility: type.id === current.id
    : String(error)                                 ? 'visible'
                                                    : 'hidden'
                                             }}
```

That includes a ternary inside a template string. Checked by `arc/ternary-lines`.

### JSX children

A child expression is padded inside its braces, `{ action.label(actions, day) }`.
One that runs over several lines ends with `}` on a line of its own, under its
`{`. Attribute values are not children and keep `={value}`, and a comment stays
`{/* … */}`. Checked by `arc/jsx-child-spacing`.

### Chains

A chain of two or more calls that runs over several lines puts each call on a
line of its own, the dots in the column of the first call's:

```tsx
{ available.filter(action => !action.last)
           .map(action =>
                (
                    <MenuItem key={action.key}
                              dense
                              onClick={() => run(() => action.run(actions, day))}>
                        { action.label(actions, day) }
                    </MenuItem>
                ))
}
```

Checked by `arc/chain-per-line`.

### A callback's JSX

The JSX a callback returns (a `.map`'s, most often) opens with `(` on a line of
its own, in the column the callback starts at, which is the column of its first
parameter. The JSX goes one indent in from there, and `)` closes in the `(`'s
column, as in the example above. A long receiver puts the JSX well to the right,
and that is accepted. Checked by `arc/callback-paren`.

### Attributes

The first attribute goes on the same line as the tag; the rest align under it.

```tsx
<TextField value={title}
           onChange={event => setTitle(event.target.value)}
           variant="outlined"
           placeholder="Card title"
           size="small" />
```

Not this, which is Prettier's default and what most of this code once did:

```tsx
<TextField
    value={title}
    onChange={event => setTitle(event.target.value)}
/>
```

The second form hides the tag name in a line of its own and puts the first thing
you want to read a line below where you are looking. With the first, the element
and its most important attribute read as one phrase, and the alignment makes the
attribute list a column you can scan. The same holds for a call or a signature
that has to wrap.

**When attributes share a line** depends on the file. In a busy file, one that
draws ten or more components, every attribute goes on a line of its own. A
quieter file keeps attributes together while the line fits in 110 characters.
"Components" means capitalised tags, `<MenuItem>` and `<Box>` but not `<path>`,
so the cut-paper pictures, which are mostly SVG shapes, stay compact.

**An `sx` object** follows the element's alignment: its first property goes
beside `{{`, and the rest line up under it. One that runs over several lines
closes with `}}` on a line of its own, under the `{{`:

```tsx
<ButtonBase onClick={event => setAnchor(event.currentTarget)}
            aria-haspopup="menu"
            sx={{ flex: 1,
                  minWidth: '1.2rem',
                  '&:hover': { backgroundColor: 'arc.paperHover', color: 'arc.onPaperStrong' }
               }}>
```

Any object that starts beside its `{` and then wraps puts each property on a
line of its own, in that column, rather than leaving some to share a line.

Checked by `arc/attribute-per-line`, `arc/attribute-align` and
`arc/attribute-object-close`. reflow.py also lays out an `sx` it finds starting
on a new line, and breaks one that runs past 110.

### Interfaces

An interface, or an object type, with three or more members has a blank line
between each, as the C# models do. A doc comment belongs to the member under it.
Two-member props interfaces stay tight. Checked by `arc/member-spacing`.

### Why this is not a Prettier config

Prettier cannot produce any of this. Its JSX output always puts the first
attribute on its own line once an element wraps, and its braces always open at
the end of the line. Neither is configurable, so Prettier cannot be run over
these files.

### What catches it

```
npm run format          # the layout fixers until they stop, then reflow.py, until neither has more to do
npm run format:check    # reflow.py alone: exit 1 if anything is out of shape
npm run check           # includes both, through ESLint and reflow.py --check
```

`npm run format` runs `tools/format.mjs`, which runs ESLint's fixers for the
rules above to a standstill and then `tools/reflow.py`, and repeats until
neither changes anything. reflow.py reads the source through a mask of what is
code and what is comment or string, and moves each block by a single delta, so
a comment inside one keeps its shape and blank lines survive. It will not touch
an element whose attributes hold a multi-line template literal: shifting that
would edit the string. The fixers skip template text for the same reason.

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
one frame, `Components/ArcPaperSceneArt.tsx`: flat shapes, each casting the same
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
`Features/Board/Assets/LaneWavesArt.tsx`). The corner above the labels is left empty for
now; "Honu Boards" is in the navy bar, in gold foil, where it has room for one
line and still shows on a phone.

**A board may have no swimlanes.** Its cards then sit straight in their
columns: one lane of sand with no label, and no corner kept for one. Deleting
the last swimlane leaves every card in its column, in no swimlane; adding a
swimlane to such a board takes every card into it. On a board that has
swimlanes, a card in none is shown in a grey "No swimlane" lane under the rest
until it is dragged out. The rule is `NO_SWIMLANE` in `Board.Types` and
`placeUnlaned` in `Board.Store`; the server's half is in `docs/api-gaps.md`.

**A board always has a column for its cards.** The last column cannot be
deleted while it holds cards. The delete overlay offers instead to move them to
a new grey column, "Orphaned", made for them first. Both delete overlays say,
before you confirm, where the cards will go.

**Where a column or swimlane goes** is chosen in a list of the ones there are
(`PlacementList`): the titles in their colours — across for columns, down for
swimlanes, as the board lays them out — with the one being placed among them,
lifted. Click a gap, drag it, or use the arrow keys. A new one starts at the end.
There is no number to type.

**A new column's colour** is offered as the next shade along from its
neighbour's own colour — deeper to the right for columns, paler downwards for
swimlanes, as the ramps run — and follows its place in the list until a colour
is picked; a neighbour on the ramp offers nothing, and the new one goes on the
ramp too. A column also has a **global colour**, which tells it from every other
column across boards: no two columns may share one (nor two swimlanes; a column
and a swimlane may). It is the colour picked unless that is taken; then a panel
under the picker (`GlobalColourPanel`) says whose it is and offers the nearest
free shade. The board still shows the colour picked. See `useColourChoice`.

### The calendar

Glass, then paper — the Blazor calendar's own arrangement, not the board's.
Each day is a pane of frosted glass of its own, laid straight on the page with
no pane round the month and nothing behind the days: glass seen through glass
was fog. The slots before the 1st and after the last day are empty — the
neighbouring months' days are not drawn, because drawn the same way they read
as part of this month. The weekday names are paper tiles: blue for the working
days, red for the weekend's — Saturday and Sunday unless the calendar's options
name others.

Across the top of a day is a header of tiles — a tablet start screen, cut from
card, each tile its own colour, laid on a sheet of sand card with a hairline of
the sheet showing between them. Each tile, the date's disc and its ring cast
the cut shadow (`.card-cut`) on the sheet; the sheet casts its own on the day's
glass, which still shows between the header and the cards under it:

| tile | stock | what it is |
|---|---|---|
| the date | a card disc, ringed | the number in gold foil, as large as the disc takes — every day at the size at which the widest date's figures all but touch its edge (`DateDiscNumber`); ringed with its tasks by type; the disc fills the ring to its inner edge; today is oxblood |
| middle | cream | the progress lines (no count in the corner), the day type's picture, or "+ Add card" — see below |
| ⋮ | yellow | quick actions |
| ‹ › | blue | step through the day's views; not drawn on a day with no cards |
| heading | oxblood | the view's name in gold foil, four capitals at most — ALL, OPEN, FEAT |

How the tiles arrange is decided by the day's own width (a container query),
not the window's, because the same day is also drawn as a live copy inside its
overlay. Under the header, the view's cards, each a note wrapped round its
tasks as green strips — the same strips, and the same popover behind them, as in
the card editor. A card is on a day when it was put there, or when anything of
it falls there: dates of its own, if it keeps them, or a point of one of its
tasks (see "What is due on a day" below). A task is never on a day without its
card. **No times on the grid:** a day there says which cards and tasks are
connected to it, and the room goes to the tasks' names. The times are in the
day overlay — on its timeline, and on its Cards list, where a card due on the
day carries a yellow tab beside its title (the Deadline tab's stock) with the
time of its first point, or "Due" with none, and each task says which of its
points falls on the day and when. On a phone, the day is a count of its cards
on a scrap of paper, yellow when one of them is due.

**Every day is the same height** (`DAY_HEIGHT`, in `Calendar.Layout.ts`). A busy
day does not stretch its week and push the rest of the month down the page:
what does not fit scrolls inside the day, under a header that stays put.

The views are a list in `Calendar.Views.ts`; the charts' numbers and colours are
in `Calendar.Stats.ts`.

No day draws a graph of nothing. The middle tile is the lines only where there
is progress to show and the day's type measures it; otherwise it is the type's
picture, or an offer to add a card (or a task, to a day whose cards have none).

### Day types

A day has a type, and the type has a picture — a scene in cut paper, drawn by
`DayTypeSceneArt.tsx` from the palette's ladders. The types are fixed, in `Calendar.DayTypes.ts`; the API stores
only the number. As they come:

| type | picture | ring | lines | an empty day shows |
|---|---|---|---|---|
| no theme | — | yes | yes | "+ Add card" |
| Work | a city | yes | yes | "+ Add card", on a chip over the skyline |
| Leisure | a park | yes | no — the picture | the picture |
| Vacation | a beach | no | no — the picture | the picture |

The picture is how the type is changed: click it at the top of the day
overlay, or use the Theme items in a day's ⋮. On a phone, where a day has no
header, it is a strip along the day's foot, and the date's disc sits on a scrap
of the same sand sheet.

**The calendar's options** (Calendar → Options, on the calendar's bar; stored
by the API) change the table. They name the weekend's days — any of the seven,
or none — and the type a weekend day is, and the type every other day is, when
nobody has chosen one for the day; "no theme" is as good a choice as any. And
for each of Work, Leisure and Vacation: its picture (or none), whether its
progress lines show, and the task type a new task on a day of it starts as — a
card opened over a day gives its editor that type (`Task.Defaults`).

A day's own type always wins. So the picker's first entry is "As the week
says", which stores 0 and follows the options, and choosing "No theme" stores
a type of its own (`PLAIN_DAY_TYPE`), so a weekend day can be plain on a
calendar whose weekends are Leisure. Nothing reads `typeId` off a stored day to
draw it: `useDayTypes().typeOf(date, typeId)` is the one place a day's type is
worked out.

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
words, the type's picture and the tags; under them the timeline, and under
that the day's cards; down the right, a slim column of frosted glass with the
day as the calendar shows it — exactly: the grid day's own width and height,
measured (`useGridDaySize`), so its layout is the grid's too — the table of
types, and the day's connections: the days either side, its cards' boards, and
other days with the same cards. Every day in it opens in the same overlay,
crossing into another month if it has to. A panel with nothing in it is not
drawn.

The timeline's label is sage, the green ladder's mid — the one stock nothing
else in the day view is cut from. The timeline does not mark the day itself:
the panel is already the day's, so its own stops are at full strength and
stops on other days are paler and carry their date. Each stop leads with its
card's title, and says under it which task and which point, or that the point
is the card's own.

**What is due on a day is not only what is on it.** A deadline belongs to a
card or a task, and the card may never have been put on the day. So the
timeline and the cards are read from every card the calendar can read: the
day's own, and the boards it knows (the default board and the boards of the
month's cards; see `useCalendarBoards`). `MonthView` reads them with the month,
and again with each re-read of it, and hands every day its points through
`Calendar.Context`. A card's own dates count only when it keeps them; otherwise
its dates are its tasks' (see "A card's dates" in `docs/timeline-model.md`), and
those are already counted, task by task. The timeline has the day's cards' whole
schedules, other days included, and anything with a time on this day.

**Cards** (`DayCardsPanel`), on one sheet of blue under the timeline, lists every
card on the day once: each card put on it, and each card with something due on
it, as notes, with "+ Add card" under them. Under each card's title, why it is
there — "Put on this day", "due — its own dates", "2 tasks due", or more than
one — then its own points on the day, then its tasks, each task with a point on
the day saying which point and when. A task is always under its card. The × to
take a card off the day is only beside a card that was put on it; a card that
is only due is there by its dates, which are changed on the card. This replaces
two halves, Due and Cards, which listed a task's deadline on its own, away from
its card, and left a card due on the day out of the day's cards.

A point "with no time" is one saved at midnight: see "A point with no time" in
`docs/timeline-model.md`.

### Choosing a day for a timeline point

A point on a card's or a task's timeline is chosen from the calendar
(`TimelineDatePicker`), in two steps in one popup:

1. **The month** (`DatePickerMonthStep`), the calendar page folded down: each day its
   number on a small disc (oxblood for today), ringed with its tasks by type,
   which is the same ring the grid draws from the same cards. Under the ring,
   each type's count beside a dot of its colour, three types at most and then
   "+". A day with nothing on it is only its number. The strip under the month
   names the types for the day pointed at or focused, so colour is never the
   only key, and counts what is already due on it. The arrow keys move between
   days and across months.
2. **The day** (`DatePickerTimeStep`), which always follows a pick: the day's hours
   on the timeline's gold rail, with everything already timed on the day from
   any board, each as long as it lasts, and the task's own other points drawn
   hollow. A click on the hours puts the point there, to the quarter hour; a
   drag down from it makes the point last as long as the drag. The arrow keys
   move it, and Shift with up or down shortens or lengthens it. Under the hours:
   - the time, typed on a piece of card (`9`, `930`, `9:30`, `21:05`), kept on
     Enter or on leaving it, refused with a red underline if it is not a time;
   - "No time", which leaves the point on the day;
   - **Lasts**: no length, 15 min, 30 min, 1 h, 2 h, 3 h or 4 h, any other
     length a drag gave it, and **Custom…** (`CustomDurationPopover`), any
     length from a minute to a week typed as hours and minutes. A point with no
     time can still last a while.

   "See the whole day" opens the preview below; Done closes the popup.

   That is **Exact time**, the first of two modes along the top of the day.
   **Relative** puts the point among the day's things instead, with no clock
   in sight (`DatePickerOrderList`): everything timed on the day in order, as
   names and lengths, with "+ here" between every two — those at the same
   moment or overlapping included — and at either end. A point put in a place
   is given the time the thing before it ends (before the first, it ends where
   the first begins), and is saved as placed rather than chosen — see
   "Relative placement" in `docs/timeline-model.md`. One too long for its place
   goes there anyway, on red, with an (i) that says why: "4 h does not fit
   between Breakfast and Lunch: there is 2 h between them…" — as does one put
   between two things with no time between them. Switching to
   Relative puts a point that has a time in the place its time falls in; on a
   day with nothing timed there is nothing to put it among, and it is left on
   the day with no time. Switching to Exact keeps the time it was given, as a
   chosen one. The lengths and Custom… are the same in both.

Under the node are three pieces of card: the day, which opens the month; the
time and its span (`15:00–17:00`, "Relative · 2 h" for a placed point, or
"No time · 2 h"), which opens the day directly; and **Day**, which opens the
preview. A placed point's time shows elsewhere with "≈" before it — `≈09:00` on
the calendar's notes and timeline — because it is where the point was put, not
a time anybody chose.

**The preview** (`DayPreviewOverlay`) is the day as the day overlay draws it: the
number and the date, the timeline, and the Cards panel, from the same cards. It
also shows the points being edited, in their places on blue, marked "as in the
editor, not saved yet", so a time can be tried and seen against the rest of the
day before anything is saved. It is read-only: it opens over a card or a task
being edited, where opening another card, or changing the day, would bury that
edit. The calendar is where the day itself is changed.

A point lasts from its time forward: a deadline at 15:00 lasting 2 h fills
15:00 to 17:00. The span shows wherever the time does: under the node, on the
day overlay's timeline, and in the preview.

### The task popover

The title and its tags across the top, the fields in a row under them
(Completed, order, type, "+ New task type"), and the timeline across the whole
width under those. The timeline used to share a row with the fields, which left
it about 300px: a node's day, time and Day pieces wrapped onto lines of their
own. It now has a little more room than it has on a card. The new-task popover
is laid out the same way.

### Nothing is written until Save

The card editor and the day overlay each have a Save, and everything changed in
them waits for it; Discard, Escape or a click outside drops it. Before, a task
was written the moment its popover was saved, and a day the moment anything on
it changed, so a card's tasks or a day's cards could change for good under an
editor that was then discarded.

**In the card editor**, a task added, edited, moved or deleted is staged
(`Task.Staging`): the task popovers say **Done** (and **Add** for a new task)
rather than Save, the list shows the tasks as they will be, and each row says
what was done to it — *new*, *edited* or *moved*. The card's dates, inherited
from its tasks, are worked out from the staged tasks. Save writes the card, then
the tasks — deletes, then creates at the end, then edits, then each task moved
to its place — and reads the board again.

**In the day overlay**, the day's type, its tags, the cards put on it or taken
off, and the tasks edited from its notes wait for its Save (`useDayDraft`). The
whole overlay, the live copy of the day on the right included, draws the day as
it will be, and a line under the cards says how many changes wait. With changes
waiting, its buttons are Discard and Save; with none, Close. Moving to another
day from inside it asks for Save or Discard first. A card opened from the day
is the card editor, with a Save of its own.

The date pickers and day previews inside either one see what it holds, not
only what is stored (`Calendar.StagedCards`): a second task added before Save
chooses its deadline beside the first one's, and a day's preview shows the
card's tasks as staged.

On the grid there is no Save to wait for, so a task opened from a day's note
there still writes on its popover's own Save, and the ⋮ menu's actions are
written at once.

Neither Save is one transaction — there is no endpoint for a card's tasks or a
day at once. A Save that fails part way says so; what it wrote is out of the
draft, and pressing Save again writes the rest.

### Tags

A card, a task and a calendar day each have a tags box (`TagsPanel`, in
`Features/TagGroup/Tag`): small red pieces of card on a blue one, and a line to
add one. Typing offers the tags that exist already, from anywhere, and choosing
one puts that tag on — "Blocked" on a card and on its task is one tag. A typed
title that matches an existing tag but for case is that tag too.

The card editor, the task popover and the day overlay hold their tags as a
draft like every other field, and write the difference on Save (`saveTags`;
`useDayDraft` for a day). Tags arrive with what they are on: a card's and its
tasks' with the board, a day's with the month.

**A tag's colour** is chosen from the board's bar: Tags → Colours
(`TagColoursOverlay`). It lists every tag there is — a tag is on no board — each
drawn in its colour; pick one, and colour it in the picker columns use. Save
writes every tag changed, Discard drops them. A tag with no colour is the red
it has always been. The colour replaces the red stock's ground (`Tag.Colours`),
so a coloured tag is still a piece of card. Its name is dark text, so the paper
grounds and mids are the colours that read.

**A tag outlives what it was on.** Deleting a card, a task, a column or a
swimlane takes its tags off it, and taking a tag off the last thing it was on
leaves it on nothing — still in the list the tags box offers, and in Tags →
Colours, with its colour. See #13 in `docs/api-gaps.md`. Tag
groups, and tags that belong to a column or a swimlane, are for later.

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

Some of it is, on purpose: braces on their own lines, one-statement bodies on
the next line, and blank lines between members all come from the C# (see
"Layout").

The space before a parameter list is not. The API is written
`ParentExistsAsync (Guid parentID, ...)`, and that is right for C#, where it is
consistent throughout. TypeScript here does not use it, and should not start:
every tool in the JS ecosystem assumes `foo(bar)`, and mixing the two inside one
repository is worse than either. The return type's colon goes the same way:
`messageOf(error: unknown): string`, not `messageOf (error: unknown) : string`.

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
npm run format    # fix everything the layout rules and reflow.py can
```

`npm run check` is the type checker (`tsc -b`), the tests for this project's
own ESLint rules, ESLint, and `reflow.py --check`. The rules are in
`tools/eslint-arc.js` and `tools/eslint-arc-layout.js`, and each message names
the section of this page it enforces:

| rule | section |
|---|---|
| `arc/file-named-for-export` | File naming |
| `arc/component-role` | Roles, Folders |
| `arc/private-last` | Member ordering |
| `arc/no-space-before-paren` | C# style is not carried across |
| `arc/fonts-from-fonts` | Shared values live in a module |
| `arc/colours-from-palette` | The palette |
| `arc/brace-own-line`, `arc/literal-own-line` | Braces |
| `arc/statement-below` | One-statement bodies |
| `arc/ternary-lines` | Ternaries |
| `arc/jsx-child-spacing` | JSX children |
| `arc/chain-per-line` | Chains |
| `arc/callback-paren` | A callback's JSX |
| `arc/attribute-per-line`, `arc/attribute-align`, `arc/attribute-object-close` | Attributes |
| `arc/member-spacing` | Interfaces |
| `no-restricted-imports` (configured in `eslint.config.js`) | the layers: Pages and Layouts over Features over Entities over Components and Lib |

A deliberate exception is an `// eslint-disable-next-line arc/…` with a comment
saying why. None of the `arc/` rules has one today.

What it does not check: the materials, the two grounds and their ramps, and
anything else about how a thing looks. Those need someone looking at the
screen, and this page is what they check it against.
