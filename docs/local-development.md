# Running ArcStrides locally

Three processes: a storage emulator, the API, and the React UI. Nothing here talks
to Azure — the emulator holds everything on your own disk.

## 1. Storage: Azurite + tables

```
npm install --prefix tools     # first time only
node tools/dev-up.mjs
```

Run both from the repository root — the folder holding `ArcStrides.sln` — in any
terminal that has Node on its PATH. In Visual Studio, **View → Terminal** opens
one there already.

> Written without `&&` on purpose. Developer PowerShell for VS 2022 is Windows
> PowerShell 5.1, which has no `&&` operator and answers `cd tools && npm install`
> with *"The token '&&' is not a valid statement separator in this version."*
> `--prefix` sidesteps the directory change entirely and works in PowerShell,
> pwsh, cmd and bash alike.

`dev-up` itself finds the repository from its own location, so only the path you
type depends on where you are standing; `node C:\src\Kanban\tools\dev-up.mjs`
works from anywhere.

That is the whole step, and it is the one command to run before pressing F5. It
starts [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite)
if it is not already running and then creates the tables. Run it as often as you
like — an emulator that is already up is left alone, and tables that already
exist are reported and skipped.

`--drop` recreates every table, which is how you get a clean slate. `--no-start`
provisions only, for when you are running the emulator yourself.

Azurite is Microsoft's Azure Storage emulator. It speaks the real Table Storage
protocol, so the API talks to it through the same `Azure.Data.Tables` client it
uses against the cloud — no test doubles, no branching in the data layer. It
ships with Visual Studio, so it may already be on your machine; otherwise:

```bash
npm install -g azurite
```

Data lives in `.azurite/` at the repo root (already gitignored), and Azurite's
own output goes to `.azurite/azurite.log`. Ports are the standard emulator ones —
`10000` blob, `10001` queue, `10002` table. Only the table endpoint matters here.

### Why the tables are a separate step

**The API never creates a table** — not in Development, not anywhere. That is
deliberate: the code path running against the emulator is the same code path that
runs against the real storage account, with no `CreateIfNotExists` that only ever
fires in one of them. So something has to play the part of whoever created the
tables in the Azure portal, and that is `dev-up`.

It reads the table names from the `[ArcTableName("…")]` attributes on the entity
models rather than keeping its own list, so an entity added later is covered
without anyone remembering a second place to update.

Skip this and the API starts fine, then fails every request with `TableNotFound`.
Skip Azurite itself and you get `no response from storage` instead — the
difference is in the status code on the exception.

### Configuration

**Nothing to configure.** `ArcStrides.API/appsettings.Development.json` already
sets:

```json
"AzureTables": { "ServiceEndpoint": "UseDevelopmentStorage=true" }
```

`UseDevelopmentStorage=true` is the Azure SDK's shorthand for the emulator's
well-known local endpoints and credentials. Because `appsettings.Development.json`
overrides `appsettings.json`, **the emulator is the default in Development** — a
dev machine cannot accidentally write to the real storage account. To deliberately
point at Azure, override `AzureTables:ServiceEndpoint` through user secrets or an
environment variable.

### Letting Visual Studio start the emulator instead

Visual Studio can launch Azurite on F5: **Connected Services → Add a service
dependency → Storage Azurite emulator**. It covers only the emulator, though —
the tables still would not exist — so you would still run
`node tools/dev-up.mjs --no-start`, and there is not much left to gain. Worth
knowing it exists if you would rather not keep a terminal around.

## 2. API

```bash
dotnet run --project ArcStrides.API --launch-profile https
```

Binds `https://localhost:7167` and `http://localhost:5100`. The UI's `.env` points at
the HTTPS one, so trust the development certificate once:

```bash
dotnet dev-certs https --trust
```

Without it, every request from the browser fails and the UI shows
`Failed to fetch` in a snackbar.

The OpenAPI document is served in Development at
<https://localhost:7167/openapi/v1.json>. `npm run generate:api` in `arcstrides.ui`
turns it into TypeScript wire types.

## 3. Seed a board

The tables exist but hold nothing, so the board renders empty.

```bash
node tools/seed-dev-board.mjs
```

Four columns, two swimlanes, six cards, three task types and a few tasks. It goes
through the HTTP API rather than writing rows directly, so it cannot drift from the
entity shapes and it exercises the same create paths the UI does.

It declines to run against a board that already has content; pass `--force` to add
the seed on top. `--url` and `--board` override the endpoint and board ID.

Note that the seeded board ID matches the one `arcstrides.ui` redirects to from `/`,
so the app finds it without any further wiring.

### And the calendar

The calendar needs no seeding. It draws whichever month you open from the date,
and a day is only stored once something is put on it: open a day and use
**+ Add card**. That creates the day's row, and the month's, on the server.

For some demo cards on this month straight away:

```bash
node tools/seed-dev-month.mjs
```

It puts the seeded board's cards on a few days around today, through the same
endpoint "+ Add card" uses (`--month 2025-01` for another month). Run it after
`seed-dev-board.mjs`. It leaves a month that already has cards alone.

## 4. UI

```bash
cd arcstrides.ui
npm install
npm run dev
```

Serves <http://localhost:54671>, which is the origin the API's `DevCors` policy
allows — don't change the port without changing `Program.cs` to match.

## When the board will not load

`GET /arcstrides/boards/{id}` validates the whole board before returning it, so
one bad row makes the board unreadable — and what you need in order to see why is
the data the API is refusing to hand over. This reads the tables directly:

```
node tools/inspect-board.mjs
```

It prints every column, swimlane and card position, then names the values that
break the API's uniqueness rules. A 400 from the board endpoint with nothing
useful in it usually means two rows share an order.

It separates a genuine conflict (two swimlanes at order 0) from a field that is
unset on every row, because the second has been true since the board was seeded
and is rarely what just changed.

## Starting over

```bash
node tools/dev-up.mjs --drop
node tools/seed-dev-board.mjs
node tools/seed-dev-month.mjs
```

No need to restart Azurite or the API. To go further and discard the emulator's
files entirely, stop Azurite, delete `.azurite/`, then run `dev-up` again.

## The order matters

Each step assumes the one before it:

| | | needs |
|---|---|---|
| 1 | `node tools/dev-up.mjs` | — |
| 2 | `dotnet run --project ArcStrides.API` (or F5) | tables to exist |
| 3 | `node tools/seed-dev-board.mjs` | the API running |
| 3b | `node tools/seed-dev-month.mjs` (optional) | the board seeded, for cards to put on days |
| 4 | `npm run dev` in `arcstrides.ui` | the API running |

Step 1 is safe to repeat and cheap when everything is already up, so it is the
one to run whenever you are not sure what state the machine is in.
