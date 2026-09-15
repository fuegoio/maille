---
title: Self-hosting
description: Run the Maille API against your own Postgres database.
---

Maille is self-hosted: you run the API against your own Postgres database, and your money never leaves your machine except to the services you point it at (your bank's exports, the LLM provider if you enable AI workflows).

## Requirements

- [PostgreSQL](https://www.postgresql.org/) (the compose file uses `postgres:17-alpine`)
- Either [Docker](https://www.docker.com/) to build and run the bundled image, or [Bun](https://bun.sh) to run the API from source
- A Google OAuth client (for Google sign-in; email and password sign-in works without it)

## 1. Start Postgres

The repository ships a compose file for the database:

```bash
cd apps/api
docker compose up -d
```

This starts a `postgres:17-alpine` container named `maille` (user `postgres`, password `postgres`, port `5432`) with a persistent volume. Point `DATABASE_URL` at it (or at any Postgres you already run):

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/maille"
```

## 2. Run the API

### From source

```bash
bun run dev    # watch mode, pretty logs
bun run build  # compiles a standalone ./dist/server executable
```

Both expect the environment variables from the [configuration reference](/reference/configuration/). On startup the server:

1. Runs database migrations from `apps/api/drizzle` (bundled with the app),
2. Compiles the GraphQL schema and writes it to `./schema.graphql`,
3. Starts the HTTP server and the workflows queue.

To regenerate migrations after schema changes:

```bash
bun run db:generate   # drizzle-kit generate, dialect postgresql
```

### From Docker

The Dockerfile builds from the repository root (it copies workspace packages), so build from there:

```bash
docker build -f apps/api/Dockerfile -t maille-api .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgres://postgres:postgres@host.docker.internal:5432/maille" \
  -e GOOGLE_CLIENT_ID=... \
  -e GOOGLE_CLIENT_SECRET=... \
  maille-api
```

The image compiles the server with `bun build --compile`, copies the `drizzle` migrations beside it, and listens on port `3000`. Migrations run automatically at startup; there is no separate migration step.

## 3. Endpoints

The server listens on port 3000 and serves under the `/api` prefix:

| Endpoint       | What it serves                                                |
| -------------- | ------------------------------------------------------------- |
| `/api/graphql` | GraphQL Yoga — queries, mutations, and SSE subscriptions      |
| `/api/auth`    | better-auth endpoints (sessions, OAuth, device authorization) |

Authentication supports email and password plus Google OAuth. The CLI logs in through better-auth's **device authorization** flow: you run `maille login` on your machine, confirm a code in the web UI, and the CLI receives a bearer token. See [connect the CLI](/getting-started/connect-the-cli/).

:::note
The server sets CORS headers for `http://localhost:5173` and trusts `http://localhost:3000` and `http://localhost:5173` as origins — the local development setup. If you deploy the UI elsewhere, adjust those values in `apps/api/src/server.ts` and `apps/api/src/auth.ts`.
:::

## 4. Run the web UI

The web UI (`apps/ui-react`) is a Vite + React app that talks to the API over GraphQL. Run it with:

```bash
cd apps/ui-react
bun run dev
```

## 5. Create your account

The first account you create through the UI's sign-up flow bootstraps a set of default accounts for you: **Revenue** (`revenue`), **Expense** (`expense`), **Cash** (`cash`), **Assets** (`assets`), **Liabilities** (`liabilities`), **Bank account** (`bank_account`, movements enabled), and **Investment account** (`investment_account`, movements enabled). Your user carries a `currency` and a `startingDate`, which seeds account balances and bounds the ledger replay.

From there, continue with [connect the CLI](/getting-started/connect-the-cli/) and [the double-entry ledger](/concepts/double-entry-ledger/).
