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

Not fixed in this commit on purpose: it is six branches of a validation check in
a project with no .NET SDK available here, so it cannot be compiled or exercised
before being pushed. It wants its own change, with the API actually run.

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

### 8. Calendar has endpoints but no UI

`CalendarController.cs` is complete for months and dates. The Blazor calendar
page has not been converted, so none of it is called.

---

## Not a gap, but worth knowing

- `CardController` has no `GET` for a board's cards; they arrive nested on
  `BoardResponse`. That is a deliberate shape, not an omission.
- Card *ordering within a cell* is computed on the client and sent as one patch
  per changed card. The server's reindex loops use
  `Single (x => x.Order == index)`, which throws on a gap or a duplicate, so
  adding a server-side reindex for rank would repeat a bug this project has
  already paid for three times. See `CardGrid.Cells.ts`.
