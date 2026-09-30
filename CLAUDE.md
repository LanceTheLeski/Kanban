# ArcStrides

Honu Boards: a kanban board and calendar.

| folder | what |
|---|---|
| `ArcStrides.API` | ASP.NET Core (.NET 10) over Azure Table Storage |
| `ArcStrides.Contracts` | the API's request and response shapes |
| `arcstrides.ui` | React 19, MUI and Vite: the conversion of the Blazor app |
| `ArcStrides.UI.Legacy` | the Blazor app, kept as the reference for what each screen did |
| `tools` | local development scripts, and the C# style check |
| `docs` | conventions, local setup, and what the API is still missing |

## Conventions

Read the one for the side you are changing before writing code there. Both are
written from the code as it is, and both say why.

- UI: `docs/ui-conventions.md`
- C#: `docs/csharp-conventions.md`

Each language keeps its own style. C# puts a space before every parameter list;
TypeScript never does. Do not carry one into the other.

## Before committing

Nothing runs these for you: there is no CI and no hook. Run them yourself, and
fix what they report before committing.

| changed | run |
|---|---|
| anything in `arcstrides.ui/` | `cd arcstrides.ui && npm run check` |
| any `.cs` in the API or the contracts | `cd tools && npm run check:csharp`, then `dotnet build ArcStrides.API` |

Some things can be fixed automatically: `npm run format` for the UI's layout,
`npx eslint --fix` for its spacing, and `node tools/check-csharp.mjs --fix` for
the C# spacing, tabs and byte order mark. Everything else is a person's call.

Never switch a rule off to get green. A real exception is a single line with its
reason next to it: `// eslint-disable-next-line arc/… -- why`, or
`// house-style: allow — why` in C#. If a convention itself changes, update its
doc and its rule in the same commit.

## Running it

`docs/local-development.md`: Azurite, the API, seeding a board and a month,
and the UI, in that order. `docs/api-gaps.md` lists what the UI needs that the
API does not do yet. `docs/timeline-model.md` covers what is unfinished in the
timelines.

## Secrets

This repository is public.

- Never commit a connection string, an account key or any other secret.
  `ArcStrides.API/appsettings.json` is gitignored; `appsettings.Example.json`
  shows its shape, and user secrets are the other place a real value can live.
- Never print a connection string that contains an `AccountKey` in output,
  logs or a commit message.
- `ArcErrorResponse` reports exception detail only in Development, because an
  exception message can carry keys and paths. Keep it that way.
