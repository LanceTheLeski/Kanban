# API gaps

What the server does not do yet, and which of those the UI is already tripping
over. Written after an endpoint-by-endpoint pass over the eight controllers;
each entry names the file so the next person does not have to find it again.

Nothing here is speculative — every item was read in the source, and the two
marked **blocking** were reproduced.

---

## Blocking

### 1. `TagRepository.ParentExistsAsync` is inverted

`ArcStrides.API/Repositories/TagRepository.cs`

Every one of its six branches returns `collection?.Count () is 0` — true when
the parent does **not** exist. `TagController` then does:

```csharp
var parentExists = await _tagRepository.ParentExistsAsync (...);
if (parentExists is false)
    return BadRequest (... NotFoundErrorResponse ("Parent"));
```

So creating a tag on a real column, swimlane, card, task or date is rejected
with "Parent not found", and creating one on a parent that does not exist
succeeds. The feature cannot work in either direction.

`TimelineRepository.ParentExistsAsync` had the same shape and was fixed to
`is not null`; this is the same fix, six times.

There is a second bug underneath it. Cases 0 and 1 query by `RowKey` alone:

```csharp
QueryColumnsAsync (column => column.RowKey == parentID.ToString ())
```

`RowKey` is the column id and `PartitionKey` is the board, so this asks "does
any board anywhere have this column", not "does *this* board". The timeline fix
took a `boardID` parameter for exactly this reason and this one should too.

Not fixed yet: it is part of the tag work, which is deferred.

A third bug sat under both, and **is** fixed: `Tag` declared `RowKey` without
`override`, so it hid the base property the table client reads, and every tag
write failed with *"Value cannot be null. (Parameter 'RowKey')"*. With the
parent check fixed, `POST /tags` would still have failed on that. Found when the
calendar's add-card endpoint made the first tag write that got past validation.

### 2. Nothing can read the tags on a card

`ArcStrides.API/Controllers/TagController.cs`

`GET arcstrides/tags/{ID}` reads one tag by its own id — which a client cannot
know without having read it from somewhere first. There is no
`GET /tags?parentID=…`, and `CardResponse` carries no tags.

So a tag written through the API can never be read back. `TagsPanel.tsx` holds
tags in local state and shows a warning dot rather than writing rows the board
could never show again; its header documents the two ways out. The smaller is to
include the parent's tags on `CardResponse`, the way tasks already are.

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
`App.tsx` redirects `/` to one hard-coded board id.

### 5. Task types cannot be deleted

`TaskController.cs` has `GET`, `POST` and `PATCH` for task types and no
`DELETE`. A type created by mistake is permanent.

Note also that `GET /arcstrides/tags/groups` carries its own TODO —
*"make this better at some point. I.e. make it follow a pattern where we query
for multiple or all TagGroups"* — so the group listing is a one-off shape rather
than the pattern the rest of the API uses.

### 6. The global colours are not unique

`Column.GlobalColumnColor` and `Swimlane.GlobalSwimlaneColor` now reach the
client (this commit), and the create and edit overlays set them to the same
value as the per-board colour.

The per-board colour is free to repeat; the global one is meant to identify a
column across boards built from the same template, so it is not. Nothing
enforces that. `ColumnController` and `SwimlaneController` already reject
duplicate titles — see `ValidatorMessages.DuplicateFieldValidatorMessage` — so
the shape of the check exists; it has to be run against every board rather than
against the one being edited, which is a different query.

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

`month` runs 1–12 in these routes; the table's `MonthOrder` runs 0–11 and the
conversion is in the controller. The two writes answer with the whole month.
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

---

## Not a gap, but worth knowing

- `CardController` has no `GET` for a board's cards; they arrive nested on
  `BoardResponse`. That is a deliberate shape, not an omission.
- Card *ordering within a cell* is computed on the client and sent as one patch
  per changed card. The server's reindex loops use
  `Single (x => x.Order == index)`, which throws on a gap or a duplicate, so
  adding a server-side reindex for rank would repeat a bug this project has
  already paid for three times. See `CardGrid.Cells.ts`.
