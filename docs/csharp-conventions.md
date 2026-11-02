# C# conventions

The house style of `ArcStrides.API` and `ArcStrides.Contracts`. Unlike the UI's
conventions, these were not drifting. The code was already about 98%
consistent. It just had nothing written down, so a new file had only its
neighbours to copy, and a new contributor (person or Claude) had no way to tell
a convention from an accident.

Everything below is taken from the code as it is. A rule marked **checked** is
enforced by `tools/check-csharp.mjs` (see "What catches it" at the end). The rest
is for review.

The legacy Blazor project is out of scope, and so is TypeScript: see "C# style
is not carried across" in `ui-conventions.md`.

---

## Spacing

### A space before every parameter and argument list — checked

In calls, declarations, constructors, attributes and keywords alike:

```csharp
[Route ("arcstrides/swimlanes")]
public class SwimlaneController : ArcController

var swimlaneResponse = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (newSwimlane);
newSwimlane.RowKey = Guid.NewGuid ().ToString ();
_swimlaneMapper = new SwimlaneMapper ();
return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (SwimlaneCreateRequest), validationResult.ToString ()));
var types = await Query<TaskType> ();
if (tagCollection.Count is 0)
```

The one exception is the `new()` constraint in a generic declaration
(`where T : class, ITableEntity, new()`). There it is a keyword, not a call, and
the checker knows that.

### A space after a cast

`(int) date.DayOfWeek`, not `(int)date.DayOfWeek`. Not checked. A pattern can't
reliably tell a cast from a parenthesised expression, and `.editorconfig` sets
`csharp_space_after_cast` so the editor types it this way.

### Four spaces — checked

Never tabs. Files are UTF-8 **with** a byte order mark, as Visual Studio saves
them (**checked**). `.editorconfig` sets both for other editors.

---

## Layout

**File-scoped namespaces — checked.** `namespace ArcStrides.API.Controllers;`,
never the braced form.

**Usings in three groups**, separated by a blank line: the ordinary ones in
alphabetical order, then any `using static`, then aliases.

```csharp
using ArcStrides.API.Repositories;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

using static ArcStrides.API.Validators.SwimlaneValidators;

using Task = System.Threading.Tasks.Task;
```

The `Task` alias is there because `Models.Board` has a `Task` of its own, a task
on a card, which would otherwise shadow the one being awaited. Every repository
carries it.

**Wrapped parameters align under the first**, which stays on the line. This is
the same rule the UI follows for JSX attributes:

```csharp
public SwimlaneController (ISwimlaneRepository swimlaneRepository,
                           ICardRepository cardRepository)
```

**Fields are grouped by kind** (validators, then mappers, then repositories)
with a blank line between groups, and the constructor assigns them in the same
order and groups.

**A one-statement `if` has no braces**, and its statement goes on the next line.

**A `catch` whose whole body is a return** goes on one line, indented one level
under the `catch`:

```csharp
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
```

**Expression-bodied members** put the `=>` on the next line, one level in:

```csharp
    public async Task<Card?> GetCardAsync (Guid boardID, Guid cardID)
        => await _cardTable.GetEntityAsync (boardID, cardID);
```

**Fluent chains** put each call on its own line, one level in, as the
validators do:

```csharp
            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.RowKey))
                .Must (ValidateColumnIDsAreGuids)
                .WithMessage (ValidatorMessages.InvalidFieldValueFormatValidatorMessage (nameof (Column.RowKey)));
```

**`#region`** names the sections of a repository, or of a repository interface,
that covers more than one table: `#region Card Position`.

---

## Comparisons are patterns

### `is null` and `is not null` — checked

Never `== null` or `!= null`. A pattern can't be redirected by an overloaded
`==`, and it reads as the sentence it is.

### `is false`, not `!` — checked

```csharp
if (validationResult.IsValid is false)
```

A `!` is one character against a `(`, and it is the easiest thing in a
condition to misread. The null-forgiving `value!` is a different operator and
is fine.

### Constants by pattern too

`Count is 0`, `Count is not 1`, not `== 0`. Not checked, because comparing two
variables still needs `==`.

**The exception is a query expression.** The lambdas passed to the
repositories' `Query…Async` methods become expression trees, which C# does not
allow patterns in. So `tag => tag.PartitionKey == ID.ToString ()` is correct
there. If one ever needs a null test, the line takes a `// house-style: allow`
(see below).

---

## Names

### `ID` in capitals — checked

Wherever it appears in a name: `boardID`, `CardPositionID`, `DateTypeID`,
`Guid ID`, `TaskTypeIDs`. `UTC` likewise: `StartPreferenceUTC`. Only `ID` is checked, because
it is the one that turns up everywhere.

### Private fields are `_camelCase` — checked

`private readonly ICardRepository _cardRepository;`, and `readonly` wherever it
can be. Constants are not fields in this sense and take no underscore. The table
names in the repositories are `private const string cards = "Cards";`.

### `Async` on repositories and services, not on endpoints — checked

A method that returns a `Task` in `Repositories/` or `Services/` ends in
`Async`, with a verb for what it does to storage: `GetCardAsync`,
`QueryCardsAsync`, `AddCardAsync`, `UpdateCardPositionBatchAsync`.

A controller action is named for its endpoint and takes no suffix: `FetchBoard`,
`CreateBoardSwimlane`, `UpdateCardPosition`, `DeleteTag`. The verbs are Fetch,
Create, Update and Delete. Private helpers inside a controller are not checked
either way.

### `var` for locals

`var` whenever the right-hand side names the type or makes it obvious, which
here is nearly always.

---

## Where things go

| what | where | shape |
|---|---|---|
| Endpoints | `Controllers/` | derive `ArcController`; validate first, returning `BadRequest (…)`; the work in a `try` whose `catch` returns `ArcErrorResponse (ex)` |
| Validation | `Validators/XValidators.cs` | FluentValidation validators nested in one `XValidators` class per resource; a controller brings them in with `using static`, or names the class (`new TagValidators.TagCreateRequestValidator ()`) |
| Mapping | `Mappers/XMapper.cs` | Mapperly: `[Mapper] public partial class`, a `[MapProperty (nameof (…), nameof (…))]` per renamed property, and a `<summary>` that names the conversion: `<see cref="DatePatchRequest"/> --> <see cref="Date"/>` |
| Any message a caller or a log will read | `Messages/` | a static method per message in `ErrorResponseMessages`, `ExceptionMessages` or `ValidatorMessages`, named for the message, with the text in its `<summary>` |
| Storage | `Repositories/` over `Services/AzureTableService` | an interface per repository; one `AzureTableService<T>` per table |
| Table entities | `Models/` | `[ArcTableName ("Cards")]` on the class |
| Wire shapes | `ArcStrides.Contracts` | `Request/Create`, `Request/Patch`, `Request/Query`, `Response`; nullable properties defaulting to `null` |

**Doc comments.** A `/// <summary>` on public members that aren't
self-evident: the messages, the mappers, the services, and anything whose
reason isn't in its name. A `<remarks>` holds the *why*, which is where the
longer explanations in this code live (`ArcController`'s
`DescribeUnexpectedException` is a good model). Not checked.

---

## Errors and secrets

**Exception detail leaves the API only in Development.** `ArcErrorResponse`
reports the whole chain of messages and the failing line when the environment
is Development, and only the exception's type name otherwise. An exception
message can carry keys, paths and connection details, and none of that belongs
in a response. Keep that check if you touch it.

**No secrets in the repository.** `appsettings.json` is gitignored. The shape
lives in `appsettings.Example.json`, and a real connection string goes in
`appsettings.json` locally or in user secrets
(`dotnet user-secrets set "AzureTables:ServiceEndpoint" "…" --project ArcStrides.API`).
The repository is public: a key that reaches a commit has to be rotated, not
just deleted, because it stays in the history.

---

## What catches it

```
node tools/check-csharp.mjs          # every .cs file in the API and the contracts
node tools/check-csharp.mjs --fix    # and mend what a machine can
cd tools && npm run check:csharp     # the checker's own tests, then the check
```

| rule | what it wants | `--fix` |
|---|---|---|
| `space-before-paren` | `Parse (value)`, `new Card ()`, `[Route ("…")]`, `if (…)` | yes |
| `tabs` | four spaces | yes |
| `encoding` | UTF-8 with a byte order mark | yes |
| `null-check` | `is null`, `is not null` | — |
| `negation` | `is false`, not `!` | — |
| `id-casing` | `ID` and `IDs`, not `Id` and `Ids` | — |
| `namespace` | file-scoped | — |
| `private-field` | `_camelCase` | — |
| `async-suffix` | a `Task` method in `Repositories/` or `Services/` ends in `Async` | — |
| `action-name` | a controller action does not | — |

It reads each file through a mask that blanks out comments, strings (including
interpolation holes) and character literals, so `"Parse(x)"` in a message or
`// boardId` in a comment is never a finding. A line with a real reason to break
a rule says so at its end: `// house-style: allow — the reason`.

`.editorconfig` carries the spacing, indentation and encoding for the editor to
type with. Visual Studio, Rider and VS Code's C# extension all read it.

### Why not `dotnet format`

`dotnet format whitespace` has the option for the space before a parameter list,
but it can only check that by checking every other whitespace rule as well, and
two of those disagree with this code on purpose. It strips the space from
`(int) value`, and it pulls the one-line `{ return …; }` under a `catch` back to
the `catch`'s own indent. There is no option for either. Run over this code, it
produced 159 changes, nearly all of them those two. So the checker checks the
house rules and nothing else.

### What it does not check

Layout (alignment, the `catch` one-liner, blank lines between groups), the
order of usings, doc comments, and the shapes in "Where things go". Those need a
reader, and this page is what the reader checks against.
