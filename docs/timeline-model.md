# The timeline model is not finished

Written after chasing two symptoms — a task's timeline never showing up in its
popover, and "complex" timelines failing to save — to a single root: the
timeline model stores one fact where it needs two, and the code that reads it
disagrees with the code that writes it.

This records what is wrong and what to do about it. The frontend has been
changed to work with the model as it stands; nothing here has been.

---

## What works today

`Timeline` itself is the right shape. It holds the four instants a schedule
needs, and the API can create and patch them:

| field | meaning |
|---|---|
| `StartPreferenceUTC` | would like to start |
| `StartDeadlineUTC` | must start by |
| `EndPreferenceUTC` | would like to finish |
| `EndDeadlineUTC` | must finish by |
| `StartDependencyTagGroupID` | what must happen before it starts (unused) |
| `EndDependencyTagGroupID` | what must happen before it ends (unused) |

`POST /arcstrides/boards/{boardID}/timelines` and
`PATCH …/timelines/{timelineID}` both work, and the rail in
`UpdateTimelinePanel` maps onto those four fields one-for-one.

---

## Problem 1 — `TimelineTypeID` carries two unrelated facts

Its own doc comment says so:

> Indicates deadline or (proper) timeline.
> **Also** indicates Card or Task parent.

One integer, two orthogonal questions. `ParentExistsAsync` answers only the
second:

```csharp
switch (timelineTypeID)
{
    case 1:// Card
    case 2:// Task
    default:
        return false;
}
```

There is no value that means *"a proper timeline, parented to a task"*. The
client had been sending `mode === 'deadline' ? 1 : 0`, so:

- **Deadline** sent `1` → accepted, and the server recorded a task's timeline
  as belonging to a card.
- **Timeline** sent `0` → `default` → `false` → `CreateTimeline` answers
  `BadRequest("Parent not found")`, before writing anything.

That is the whole of "complex timelines don't work": they were rejected at the
door.

**Suggested fix.** Split the field.

- `ParentObjectTypeID` — `1 = Card`, `2 = Task`. This is what
  `ParentExistsAsync` actually wants, and `Tag` already models its parent this
  way with `ParentObjectTypeName`, so there is a precedent to match.
- Drop the deadline-vs-timeline half entirely. It is **derivable**: dates in
  the preference fields make it a timeline, a deadline field alone makes it a
  deadline, nothing at all makes it timeless. `UpdateTimelinePanel` already
  decides what to show that way when it loads one back, so storing it only
  creates a second version of the truth that can disagree with the dates.

Keeping `TimelineTypeID` as the parent kind and leaving the name alone is a
smaller change and would work; the rename is worth it because the current name
is what invited a mode to be stored in it.

---

## Problem 2 — `ParentExistsAsync` cannot return a correct answer

```csharp
var cardCollection = await _cardRepository.GetCardsAsync (parentID);
return cardCollection?.Count () is 0;
```

Two faults in two lines:

1. **Wrong argument.** `GetCardsAsync` and `GetTasksAsync` both take a
   **`boardID`** — they query by partition key. They are being handed a
   *parent* ID, so they query a partition that does not exist and return
   nothing.
2. **Inverted result.** `Count () is 0` is `true` when the parent was *not*
   found. The method returns "the parent exists" precisely when it does not.

The two cancel out, which is why creating a deadline appears to work: the
lookup finds nothing, the inversion calls that success. A correct lookup with
the inversion still in place would reject every valid parent.

**Suggested fix.** The board ID is already in scope in `CreateTimeline`, so
pass it:

```csharp
public async Task<bool> ParentExistsAsync (Guid boardID, Guid parentID, int parentObjectTypeID)
    => parentObjectTypeID switch
    {
        1 => (await _cardRepository.GetCardsAsync (boardID))
                 .Any (card => card.RowKey == parentID.ToString ()),
        2 => (await _taskRepository.GetTasksAsync (boardID))
                 .Any (task => task.RowKey == parentID.ToString ()),
        _ => false,
    };
```

Worth a test before it ships: a real parent must return `true`, and a random
GUID must return `false`. Both currently return `true`.

---

## Problem 3 — the parent link was written one way and read the other

`Timeline.ParentObjectID` points at the card or task. `Task.TimelineID` and
`Card.TimelineID` point back. Only the first is ever written:
`CreateTimeline` sets `ParentObjectID`, and **nothing in the solution assigns
`Task.TimelineID` or `Card.TimelineID`** — searching for them finds the two
model declarations and one reader.

That reader was `BoardController`, matching `timeline.RowKey ==
cardTask.TimelineID`. It never matched, so no task's timeline ever reached the
client — which is the "timeline doesn't populate" bug, and it was never a UI
problem. Card timelines were worse: nothing assigned `CardResponse.Timeline`
at all.

**Fixed** in `BoardController` by matching on `ParentObjectID`, the direction
that is actually written, and by populating the card's timeline the same way.

**Still to do.** Delete `Task.TimelineID` and `Card.TimelineID`. A back-pointer
that nothing maintains is worse than no back-pointer: it reads like the link
and silently is not. If they are kept for query performance, whatever creates a
timeline has to write them in the same transaction — which is a second thing to
keep in step, for a board that already loads every timeline in one query.

---

## Problem 4 — nothing deletes a timeline

Deleting a task or a card leaves its timeline row behind, parented to an ID
that no longer resolves. Nothing reads it, so nothing breaks today; the table
grows forever.

**Suggested fix.** Fold the timeline into the existing `ArcTransaction` in
`DeleteTaskAndUpdateEffectedTasks` and its card equivalent, so the row goes
with its parent atomically.

---

## A point with no time

A point can be given a day and no time of day: "due Friday", not "due Friday
at five". The model has nowhere to say so. Each point is one `DateTime`.

**What the UI does.** A point with no time is saved at its day's local
midnight, which is what folding a date with no time into a timestamp has
always produced (`Timeline.Draft`). Midnight is read back as no time
(`isTimed` in `Timeline.Nodes`): the editor shows the day with "No time", and
the day overlay lists the point under Due rather than on the timeline. The
picker keeps midnight off its hour scale, and a typed 00:00 means "no time".

**What that costs.**

- A deadline of exactly midnight cannot be saved. 23:45 or 00:15 is as near
  as the picker goes.
- "Local" is whichever time zone the browser saving it was in. A point saved
  with no time in Chicago reads as 23:00 the day before in Denver, and as timed.

**Suggested fix.** A flag beside each point (`StartPreferenceHasTime`, and so
on), or a date-only field beside each timestamp. Either lets "no time" be
stored as such, and leaves midnight as just another time. `isTimed` is the one
place the UI would change.

---

## Not started: card timelines are not saved

A card has a timeline of its own (`Card.TimelineID`), and the card overlay
shows `UpdateTimelinePanel` for it. Nothing saves what is chosen there: the
overlay passes the panel no `onDraftChange`, so a card's points can be set in
the editor and are gone when it closes. Only tasks' timelines are written,
through `UpdateTaskPopover` and `CreateTaskOverlay`. Wiring the card's the same
way is the missing piece: `createTimeline` with the card as its parent and
`TIMELINE_PARENT_CARD`, then `updateTimeline` once it exists. The server already
reads a card's timeline back by its parent (problem 3).

---

## Not started: dependency tag groups

`StartDependencyTagGroupID` and `EndDependencyTagGroupID` are declared,
mapped through to `TimelineResponse`, and never set or read. The intent is
recorded in a comment on the model — *"Everything that needs to be done prior
to start. Should probably link to a TAG GROUP GUID with children being
Tasks."*

That is a real feature (a task that cannot start until others finish) and a
much larger one than anything above: it needs a dependency graph, cycle
detection, and a decision about what the board does when a dependency slips.
Worth leaving where it is until the four dates are trustworthy.

---

## Order to do it in

1. **Fix `ParentExistsAsync`** — problem 2. Nothing else can be trusted while
   it answers backwards, and it is contained.
2. **Split `TimelineTypeID` into a parent kind** — problem 1. The frontend
   already sends the parent kind (`TIMELINE_PARENT_TASK = 2`), so this is the
   server catching up.
3. **Delete the unmaintained back-pointers** — problem 3's remainder.
4. **Delete timelines with their parents** — problem 4.

1 and 2 together are what make a full timeline savable. 3 and 4 are tidying
that stops the next person hitting the same thing.
