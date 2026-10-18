# API gaps

What the server does not do yet, and which of those the UI is already tripping
over. Written after an endpoint-by-endpoint pass over the eight controllers;
each entry names the file so the next person does not have to find it again.

Nothing here is speculative — every item was read in the source, and each one
marked fixed was reproduced against Azurite before and after.

---

## Blocking

Nothing, at the moment. The two that were here, both about tags, are fixed;
they keep their numbers because code points at them.

### 1. `TagRepository.ParentExistsAsync` was inverted — fixed

`ArcStrides.API/Repositories/TagRepository.cs`

Every one of its six branches returned `collection?.Count () is 0` — true when
the parent did **not** exist — so creating a tag on a real column, swimlane,
card, task or date was rejected with "Parent not found", and creating one on a
parent that did not exist succeeded. The card and task branches also read the
parent ID as a *board* ID (`GetCardPositionsAsync`, `GetTasksAsync` take one),
so they could not have found the parent either way. Each branch now looks the
parent up by its own ID and answers `is not 0`. The parent types are named in
`Models/Tag/TagParentTypes.cs`.

This note used to say the column and swimlane branches should take a board ID,
as the timeline check does. They do not: a tag is on no board — a day is on
none — and the IDs are GUIDs, so the parent's own ID names one row.

The validator turned every tag on a column away too: `NotEmpty` on the type
treats 0, which is a column, as missing. It is `NotNull` and a range now.

Under both sat `Tag.RowKey` without `override`, which hid the key the table
client reads, so every tag write failed with *"Value cannot be null. (Parameter
'RowKey')"*. Fixed earlier, when the calendar's add-card endpoint made the first
tag write that got past validation.

### 2. Nothing could read the tags on a card — fixed

A tag is one ID (the PartitionKey) with a row for each thing it is on (the
RowKey), so "Blocked" on a card and on its task is one tag with two rows. They
are read now:

| call | does |
|---|---|
| `GET tags` | every tag there is, each once — what the tags box suggests from as you type |
| `GET tags?parentID=` | the tags on one thing |
| `POST tags` `{ ParentID, TypeID, Title }` or `{ …, ID }` | puts a tag on: the one with that ID, or else the one with that title in any case, or else a new one. 201 when put on, 200 when it was on already |
| `DELETE tags/{ID}/parents/{parentID}` | takes it off one thing |
| `PATCH tags/{ID}` | renames it everywhere it is; refuses a title another tag has |
| `DELETE tags/{ID}` | deletes it from everything |
| `POST calendars/dates/2026/9/24/tags`, `DELETE …/tags/{tagID}` | a day's own tags, writing the day's row if need be; answer with the month |

And they arrive with what they are on: `CardResponse.Tags` and the new
`TaskResponse.Tags` on the board and in the month, `DateResponse.Tags` in the
month. `PATCH` used to require exactly one row and then write a `Tag` built
from the patch alone, with no keys, which the table refused.

**The calendar's rows are not tags.** The calendar links a day to its cards
through this same table — a day names a tag group, and each tag in it has a card
as its parent (#8). Those rows have a parent of type card too, so a card's tags
would have included one per day it is on, titled with the card's own title.
`Tag.IsLabel` tells them apart: true for a tag someone put on something, false
for the calendar's links — which were written before it existed, and so read as
false without being touched.

Not done yet:

- **Deleting a card or a task leaves its tag rows.** As #3 leaves the card row.
  Nothing reads a tag without its parent, so they are unseen, but they count
  toward the list `GET tags` offers.
- **Tags have no colour or group.** The red on the board is the same for all of
  them; `TagGroup` and `TagType` exist and are not used for this yet.
- **Columns and swimlanes** can carry tags (types 0 and 1); nothing in the UI
  puts them on.

---

## Incomplete, not yet blocking

### 3. Deleting a card leaves the card row behind

`BoardController.cs:252`, and the comment on the route says so:

> Need to delete from board AND card tables. There might also be extensions to
> remove. For now though, I'm just going to do board.

`DELETE boards/{boardID}/cards/{cardID}` removes the `CardPosition` and the
board's reference. The `Card` row, its tasks and its timeline stay. The board
looks right, and the table grows.

`CardController` has no `DELETE` of its own, so there is nowhere to put the rest
of it yet.

### 4. There is no way to list boards

`BoardController.cs` has `GET {ID}`, `POST`, `PATCH {ID}`, `DELETE {ID}`, and no
`GET ""`. A client can only open a board whose id it already has — which is why
`/` redirects to one board id (`Board.Defaults.ts`).

Nor does a board have a name. There is no Boards table: a board is only the ID
its columns, swimlanes and cards share, and `FetchBoard` answers with the literal
title `"Placeholder.."`. The UI maps that to no title, and the calendar's board
views are labelled from the ID ("Board 1CB0") until there is a name to use.

### 5. Task types cannot be deleted

`TaskController.cs` has `GET`, `POST` and `PATCH` for task types and no
`DELETE`. A type created by mistake is permanent.

Note also that `GET /arcstrides/tags/groups` carries its own TODO —
*"make this better at some point. I.e. make it follow a pattern where we query
for multiple or all TagGroups"* — so the group listing is a one-off shape rather
than the pattern the rest of the API uses.

### 6. The global colours are not unique — fixed

`Column.GlobalColumnColor` and `Swimlane.GlobalSwimlaneColor` identify a column
(or a swimlane) across boards built from the same template, so no two columns
may share one, on any board, and no two swimlanes; a column and a swimlane may.
The per-board colour is free to repeat.

`ColumnController` and `SwimlaneController` now refuse a create or a patch that
gives one a global colour another already has, compared without case or
surrounding space, with *"The global colour #79aad8 is already "Done"'s"*. Only
when the global colour changes, so a column that shared one from before can
still be renamed or moved. `GET columns/globalcolors` and `GET
swimlanes/globalcolors` list who has which, and the overlays read them to offer
a free shade before saving (see `GlobalColourPanel` in the UI).

A colour is cleared by setting it to the empty string. A null is left out of the
merge and would change nothing (#9); the UI reads an empty colour as none, and
the uniqueness check ignores it.

### 7. `TimelineTypeID` carries two facts at once

Documented in `docs/timeline-model.md`, unchanged. The enum means both "deadline
or timeline" and "parented to a card or a task", and there is no value meaning
"a proper timeline, parented to a task". The UI works around it by sending the
parent kind and recovering the mode from the dates.

### 8. The calendar: what is there, and what is still missing

`ArcStrides.API/Controllers/CalendarController.cs`

A month is not stored as a thing of its own. It is the rows of the days
something has been put on, and they share an ID minted with the first of them.
So the calendar addresses months and days by the date, and never needs an ID:

| call | does |
|---|---|
| `GET months?year=2026&month=9` | what is stored for a month; 200 with no dates if nothing |
| `POST dates/2026/9/24/cards` `{ CardID }` | puts a card on a day, writing the day's row and the month's ID if they do not exist yet |
| `DELETE dates/2026/9/24/cards/{cardID}` | takes it off |
| `PUT dates/2026/9/24/type` `{ DateTypeID }` | says what kind of day it is, writing the day's row if need be; 0 clears it |

`month` runs 1–12 in these routes; the table's `MonthOrder` runs 0–11 and the
conversion is in the controller. The writes answer with the whole month.

A day's type is only a number on its row, `Date.DateTypeID`, sent back as
`DateResponse.DateTypeID`. What each number means — Work, Leisure, Vacation,
their pictures and what they change on the calendar — is defined by the UI, in
`arcstrides.ui/src/Features/Calendar/Calendar.DayTypes.ts`, because each is
drawn by code. Rows written before the field existed read as 0, no type.
Cards reach a day through the same rows `FetchMonth` always read: the day's
`CardTagGroupID` → a `TagGroups` row per tag → a `Tags` row whose RowKey is
the card. The endpoints write them, so the tag endpoints (#1, #2) are not
needed for this.

Still missing:

- **`POST months` and `DELETE dates/{ID}` answer 418.** Both are `//todo`, and
  nothing needs them any more: the card endpoint creates what it needs.
- **Two first writes to an empty month at the same moment** could each mint a
  month ID. Reads match on year and month, not on the ID, so every day still
  shows. Two rows for one *day* could hide one's cards; the write path prefers
  the row that already has cards, which narrows it without closing it.
- **`DateResponse` has no `MonthOrder`**, though the table stores it. The UI
  recovers the month from `MonthName`, which only works while that is English.
- ~~A date has no tags.~~ It does: a tag whose parent is the date's own ID,
  written by `POST dates/…/tags` and sent back on `DateResponse.Tags` (#2). No
  second group ID was needed — the parent is the row.
- **Nothing lists what is due on a day.** A task is due on a day whether or
  not its card was put on it, so the day overlay's cards and the date picker
  under a timeline node read every board the calendar knows, whole, and look
  through every task's timeline. `GET calendars/months` returning the
  month's timeline points, with their tasks and cards, would replace that with
  one read, and would find deadlines on boards the calendar cannot name.

Fixed, each reproduced against Azurite first. The first two each returned 500
for the whole month, not just the day:

- **A deleted card.** #3 deletes the card's position and keeps the `Card` row,
  and the day's tag still points at the card. `FetchMonth` found no position and
  passed `null` to `MapCardPositionToCardPositionResponse`: a
  `NullReferenceException`. A card with no position is now skipped.
- **A card on two days of the same month.** It was read once per tag, so its
  position was read twice, and `SingleOrDefault` threw on the pair. The card IDs
  are now de-duplicated before they are read.
- **No timelines.** Every task reached the calendar with an empty timeline, so
  a day's deadlines could never be listed. They are now matched on
  `ParentObjectID`, the way `BoardController` does.
- **`MonthResponse.ID` and `Title`** were never set. They are now.
- **No task types.** The month looked each card's task types up by the board
  ID, but a type is filed under its tag group, so every task arrived untyped
  and a day's type breakdown could only ever say "No type". It now reads every
  type once for the month, the way `BoardController` does.

---

### 9. A field set to null is never cleared

`AzureTableService.UpdateEntityAsync` writes with Table Storage's *merge*, and
the SDK leaves a null property out of a merge. So a PATCH that sets a field to
null answers 200, and the stored row keeps its old value. The card, column and
task mappers skip nulls as well (`AllowNullPropertyAssignment = false`), for the
keys they must not overwrite.

Fixed for timelines, where a cleared point is everyday: they are patched with
`TimelinePatchMapper` and written with `ReplaceEntityAsync`, the whole row at
once (see `docs/timeline-model.md`). Every other entity still merges, which
matters wherever one of its fields is meant to be cleared. An entity read whole
and written back can move to `ReplaceEntityAsync` the same way; one written from
a partial copy must not, or it loses the fields it did not carry.

### 10. The calendar's options

`ArcStrides.API/Controllers/CalendarOptionsController.cs`

| call | does |
|---|---|
| `GET calendars/options` | the weekend's days, the type a weekend day and any other day is with none of its own, and what has been changed about each type; the defaults when nothing is stored |
| `PUT calendars/options` | replaces them, whole; a type left out goes back to the UI's own definition |

Two new tables, `CalendarOptions` (one row) and `DateTypeOptions` (one per type
changed), both keyed by `Guid.Empty`: there is one calendar, and when calendars
have IDs this is keyed by one. `dev-up` creates them; a real storage account
needs them made, as every table does. The types themselves are still defined
by the UI; only what was changed about them is stored.

A day's stored type is still only a number, and 0 still means none chosen — now
"follow the options". Choosing "No theme" on a day stores 4, a type of its own,
so it stands against a default.

### 11. Deleting the last swimlane or column lost its cards — fixed

`SwimlaneRepository` / `ColumnRepository`,
`ApplyNewTitleAndOrderForExistingCardPositions`

A deleted swimlane's cards moved to the swimlane that took its place, chosen
among the swimlanes whose order the delete had changed. Deleting the *last*
swimlane — by order — changes no other order, so the deleted swimlane was the
only candidate, and its cards were moved into it: they kept the ID of a row
that was gone, matched no lane, and disappeared from the board, while the
calendar, which does not look at lanes, still showed them. Deleting the only
swimlane did the same, and columns had the same shape. The cards were also
matched by title, which a rename leaves stale.

Now the cards go to the one after, or else the one before, among every swimlane
the board keeps, matched by ID. With no swimlane left, they keep their columns
and are in none: `CardPosition.SwimlaneID` is `Guid.Empty` (empty rather than
null, for #9). Adding a swimlane to such a board puts every card in none into it,
and so heals a board an earlier delete left that way. A card can be created on
a board with no swimlanes, and is refused one without a swimlane on a board that
has any.

A card is never in no column: the last column cannot be deleted while it holds
cards (400). The UI makes an "Orphaned" column for them first.

### 12. A task with a type that does not exist was kept, and broke its board — fixed

`ArcStrides.API/Controllers/TaskController.cs`, `BoardController.cs`

`CreateTask` wrote the task and then looked its type up, so a `TaskTypeID` that
does not exist was answered 400 — and the task stayed. `FetchBoard` then mapped
the missing type and threw a `NullReferenceException`, and the whole board
answered 500 until the row was deleted by hand. The type is now checked before
anything is written, and the board reads a task whose type is gone as untyped,
as the calendar already did.

## Not a gap, but worth knowing

- `CardController` has no `GET` for a board's cards; they arrive nested on
  `BoardResponse`. That is a deliberate shape, not an omission.
- Card *ordering within a cell* is computed on the client and sent as one patch
  per changed card. The server's reindex loops use
  `Single (x => x.Order == index)`, which throws on a gap or a duplicate, so
  adding a server-side reindex for rank would repeat a bug this project has
  already paid for three times. See `CardGrid.Cells.ts`.
