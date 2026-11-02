# The timeline model is not finished

Written after chasing two symptoms — a task's timeline never showing up in its
popover, and "complex" timelines failing to save — to a single root: the
timeline model stores one fact where it needs two, and the code that reads it
disagrees with the code that writes it.

This records what is still wrong and what to do about it, and what has been
fixed where the fix changed how the model is used.

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

## Problem 1 — `TimelineTypeID` is the parent's kind, by another name

The server reads `TimelineTypeID` for one thing: `ParentExistsAsync` takes 1 as
a card and 2 as a task, and anything else as no parent. The UI sends exactly
that (`TIMELINE_PARENT_CARD`, `TIMELINE_PARENT_TASK` in `Timeline.Draft`).

It was once also meant to say whether a timeline was a deadline or a proper
one, and the client sent that instead — so a proper timeline was refused as
having no parent, and a deadline on a task was filed under a card. Nothing
stores the mode now. It is worked out from the dates (`modeOf`): a required end
alone makes a deadline, any other point makes a timeline, nothing at all is
timeless, which is how `UpdateTimelinePanel` decides what to show when it loads
one back. It used to ask only about the preference dates, so a required start
and a required end with no preferred dates read as a deadline, which has only
the end: the start was left out of the draft and cleared at the next save.

**Still to do.** Rename it `ParentObjectTypeID`, to match how `Tag` models its
parent. The name is what invited a mode to be stored in it, and still says a
timeline has a type.

---

## Problem 2 — the parent link was written one way and read the other

`Timeline.ParentObjectID` points at the card or task. `Task.TimelineID` and
`Card.TimelineID` point back. Only the first is ever written:
`CreateTimeline` sets `ParentObjectID`, and **nothing sets `Task.TimelineID`
or `Card.TimelineID`**. A task PATCH could carry one (`TaskPatchRequest`
maps it), but no client sends it.

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

## Problem 3 — deleting a card or a task leaves its timeline

`DELETE …/timelines/{timelineID}` deletes one, but nothing calls it when its
parent goes. Deleting a task or a card leaves its timeline row behind, parented to an ID
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
the day overlay lists the point under its card rather than on the timeline. The
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

## Fixed: a cleared point never cleared

Taking a point off a timeline, or making it Timeless, sends a PATCH replacing
the point with null. The API answered 200 and kept the old date, for two
reasons, one under the other:

1. The patched request was copied onto the stored row by `TimelineMapper`,
   which skips nulls (`AllowNullPropertyAssignment = false`). That is right
   for the keys it must not touch, and wrong for a patch.
2. Underneath that, `AzureTableService.UpdateEntityAsync` writes with Table
   Storage's *merge*, and the SDK leaves a null property out of a merge
   entirely. So even a null that reached the row was never sent.

**Fixed** for timelines. A patch is applied by `TimelinePatchMapper`, which
writes every field the patch request carries, nulls included. The row is then
written with `ReplaceEntityAsync`, the whole row at once. The client sends
Timeless as a patch of nulls (`saveTimeline` in `Timeline.Draft`), where it used
to send nothing at all. A timeline with no points left still has its row and
its ID, and reads back as Timeless.

The merge underneath is the same for every entity. See `docs/api-gaps.md`, #9.

---

## Fixed: card timelines are saved

A card has a timeline of its own, and the card overlay shows
`UpdateTimelinePanel` for it. Until now nothing saved what was chosen there:
the overlay gave the panel no `onDraftChange`. It now saves through
`saveTimeline`, as the task popover does: created with the card as its parent
(`TIMELINE_PARENT_CARD`), patched in place after that. A card's points are
stops on the calendar like a task's, with no task (`Stop.task` is null).

---

## A card's dates

A card goes by its tasks' dates unless it keeps its own. Its tasks' are put
together point by point (`Timeline.Inheritance`):

| card point | from its tasks |
|---|---|
| preferred start | the earliest preferred start |
| required start | the earliest required start |
| preferred end | the latest preferred end |
| required end | the latest required end — a deadline-only task has just this |

So a card whose tasks are all deadlines is due when the last of them is; one
task with a timeline gives the card its starts; a mix takes the earliest starts
and the latest ends of all of them. Each point keeps the length of the task
point it came from. Nothing inherited is stored: it is worked out wherever the
card is drawn.

The card editor's timeline ends with a segment saying where the dates come
from — "Taken from its tasks — 2 of 3 have dates", or "The card's own dates" —
and a box, **Inherit timeline info from tasks**. Ticked, the default, the
timeline shows the tasks' dates, read-only. Unticked, it is the card's own,
edited as before; unticked on a card with no dates of its own, it starts from
its tasks'. Ticking it again keeps the card's own timeline row, unused, so
unticking brings it back.

The box is the opposite of `Card.OverridesTaskTimelines` (`PATCH …/cards/{ID}`
`/overridesTaskTimelines`), which says the card keeps its own. That is null on
every card saved before it existed, and null is read as "keeps its own if it has
a timeline of its own" (`overridesTasks`) — the box unticked — so a date someone
set on a card is never quietly replaced by its tasks'.

**On the calendar**, a card's own dates are stops only when it keeps them. Its
tasks' points are stops either way, under the card: a card is on every day one
of its tasks has a point, and on the days of its own dates when it keeps them,
even where no task has anything. A task is never on a day without its card
(`cardsOnDay`, in `Calendar.Stops`).

---

## Durations

A point can last a while: "starting takes about two hours". Each of the four
points has a duration beside it, in minutes, from the point's time forward:

| point | duration |
|---|---|
| `StartPreferenceUTC` | `StartPreferenceDurationMinutes` |
| `StartDeadlineUTC` | `StartDeadlineDurationMinutes` |
| `EndPreferenceUTC` | `EndPreferenceDurationMinutes` |
| `EndDeadlineUTC` | `EndDeadlineDurationMinutes` |

Null is an instant. The API takes 1 minute to a week (`TimelineValidators`);
longer than a week is a timeline of its own. A point with no time can still have
a duration: a two-hour job, some time that day. A duration with no point is
dropped when the draft is saved (`draftToTimelineDates`).

---

## Relative placement

A point can be put among a day's other points instead of at a time: "after
breakfast", "between breakfast and lunch". The day picker's Relative mode does
it (see "Choosing a day for a timeline point" in `docs/ui-conventions.md`;
the arithmetic is `Calendar.RelativePlacement`).

The API still stores one instant per point, so a placed point is given one:
where the thing before it ends, or, before the first thing, early enough to end
as the first begins; on a day with nothing timed, noon. Beside it, each point has a flag saying the time was
placed, not chosen:

| point | placed |
|---|---|
| `StartPreferenceUTC` | `StartPreferenceTimeIsRelative` |
| `StartDeadlineUTC` | `StartDeadlineTimeIsRelative` |
| `EndPreferenceUTC` | `EndPreferenceTimeIsRelative` |
| `EndDeadlineUTC` | `EndDeadlineTimeIsRelative` |

Null (every row saved before it) and false are a chosen time. A point with no
time is never placed: the flag is cleared with the time (`draftToTimelineDates`).
A card inheriting from its tasks keeps the flag of the task point it took.

**Not done yet.** The time is fixed once given. When the thing before a placed
point moves, the point stays where it was, and may no longer be after it.
Keeping placed points in order as the day changes — and choosing their times
from the day as a whole — is the day's job, and is the next step for this.

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

None of these blocks anything today; each stops the next person hitting the
same thing.

1. **Rename `TimelineTypeID` to `ParentObjectTypeID`** — problem 1.
2. **Delete the unmaintained back-pointers** — problem 2's remainder.
3. **Delete timelines with their parents** — problem 3.
