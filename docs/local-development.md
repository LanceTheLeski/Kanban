# Running ArcStrides locally

Three processes: a storage emulator, the API, and the React UI. Nothing here talks
to Azure — the emulator holds everything on your own disk.

## 1. Storage: Azurite

[Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) is
Microsoft's Azure Storage emulator. It speaks the real Table Storage protocol, so
the API talks to it through the same `Azure.Data.Tables` client it uses against the
cloud — no test doubles, no branching in the data layer.

It ships with Visual Studio, so it may already be on your machine. Otherwise:

```bash
npm install -g azurite
```

Run it (from wherever you want the data files to live):

```bash
azurite --silent --location ./.azurite
```

That listens on the standard emulator ports — `10000` blob, `10001` queue,
`10002` table. Only the table endpoint matters here.

> Add `.azurite/` to your `.gitignore` if you keep the data inside the repo.

**Nothing else to configure.** `ArcStrides.API/appsettings.Development.json` already
sets:

```json
"AzureTables": { "ServiceEndpoint": "UseDevelopmentStorage=true" }
```

`UseDevelopmentStorage=true` is the Azure SDK's shorthand for the emulator's
well-known local endpoints and credentials. Because
`appsettings.Development.json` overrides `appsettings.json`, **the emulator is the
default in Development** — a dev machine cannot accidentally write to the real
storage account. To deliberately point at Azure, override
`AzureTables:ServiceEndpoint` through user secrets or an environment variable.

### Create the tables once

Nobody wrote the tables in the Azure portal for you locally, and **the API never
creates a table** — not in Development, not anywhere. That is deliberate: the code
path running against the emulator is the same code path that runs against the real
storage account, with no `CreateIfNotExists` that only ever fires in one of them.

So creating them is a setup step, run once per emulator instance:

```bash
cd tools && npm install      # first time only
cd .. && node tools/provision-azurite.mjs
```

It reads the table names from the `[ArcTableName("…")]` attributes on the entity
models rather than keeping its own list, so an entity added later is covered without
anyone remembering a second place to update. Running it again reports what is
already there and creates only what is missing.

`--drop` deletes and recreates every table, which is how you get a clean slate.
`--connection` points it somewhere other than the emulator.

If you skip this step the API starts fine and then fails every request with
`TableNotFound`.

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

## 4. UI

```bash
cd arcstrides.ui
npm install
npm run dev
```

Serves <http://localhost:54671>, which is the origin the API's `DevCors` policy
allows — don't change the port without changing `Program.cs` to match.

## Starting over

```bash
node tools/provision-azurite.mjs --drop
node tools/seed-dev-board.mjs
```

No need to restart Azurite or the API. To go further and discard the emulator's
files entirely, stop Azurite, delete its data directory (`./.azurite`, or wherever
you pointed `--location`), then start it and provision again.

## The order matters

Each step assumes the one before it:

| | | needs |
|---|---|---|
| 1 | `azurite` | — |
| 2 | `node tools/provision-azurite.mjs` | Azurite running |
| 3 | `dotnet run --project ArcStrides.API` | tables to exist |
| 4 | `node tools/seed-dev-board.mjs` | the API running |
| 5 | `npm run dev` in `arcstrides.ui` | the API running |

Only step 2 is once-per-emulator. Steps 1, 3 and 5 are your everyday processes.
