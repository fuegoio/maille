---
title: Configuration
description: Every environment variable and configuration file, with defaults.
---

Maille's configuration surface is deliberately small: environment variables for the API server, and one config file for the CLI.

## API server environment variables

Validated at boot with zod (see `apps/api/src/env.ts`). Builds set `SKIP_ENV_VALIDATION=1` to defer validation to runtime.

| Variable                   | Required | Default                                              | Meaning                                             |
| -------------------------- | -------- | ---------------------------------------------------- | --------------------------------------------------- |
| `GOOGLE_CLIENT_ID`         | yes      | —                                                    | Google OAuth client id                              |
| `GOOGLE_CLIENT_SECRET`     | yes      | —                                                    | Google OAuth client secret                          |
| `DATABASE_URL`             | no       | `postgres://postgres:postgres@localhost:5432/maille` | Postgres connection string                          |
| `LOG_LEVEL`                | no       | `info`                                               | Pino log level                                      |
| `MISTRAL_API_KEY`          | no       | _(unset)_                                            | LLM API key; when absent, AI workflows are disabled |
| `WORKFLOWS_LLM_BASE_URL`   | no       | `https://api.mistral.ai/v1`                          | OpenAI-compatible endpoint for workflows            |
| `WORKFLOWS_LLM_MODEL`      | no       | `glm-5-2`                                            | Model used by workflows                             |
| `WORKFLOWS_MAX_ATTEMPTS`   | no       | `2`                                                  | Attempts before a workflow settles as `failed`      |
| `WORKFLOWS_TIMEOUT_MS`     | no       | `120000`                                             | Workflow run timeout                                |
| `WORKFLOWS_RETRY_DELAY_MS` | no       | `5000`                                               | Delay before a provider-error retry                 |

### About the Google OAuth requirement

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are validated as required at boot. Email and password sign-in also exists (minimum 8 characters, at least one special character and one number), and the CLI uses device authorization rather than Google — but the server currently requires the Google variables to be present even if you only use passwords.

## User settings

Two settings on your user shape the whole ledger:

- `currency` — the single currency of the ledger (the default is `EUR`); amounts are plain numbers in it.
- `startingDate` — the date your ledger starts. It seeds account starting balances, bounds the fund-position replay, and re-dates fund allocations that would otherwise fall before it.

## CLI configuration file

`~/.maille/config.json` (mode `600`):

| Key      | Meaning                                                      |
| -------- | ------------------------------------------------------------ |
| `apiUrl` | GraphQL endpoint, default `https://maille.alexistac.net/api` |
| `uiUrl`  | Web UI base URL, used for device-authorization login         |
| `token`  | Bearer token (cleared by `maille logout`)                    |
| `user`   | `{ id, name, email, currency }` snapshot from login          |

Point the CLI at your own instance with `maille login --url ... --ui-url ...` — see [connect the CLI](/getting-started/connect-the-cli/).

## Database

- Migrations live in `apps/api/drizzle` and run automatically at server startup — there is no manual migration step.
- Regenerate migrations after schema changes with `bun run db:generate` in `apps/api` (drizzle-kit, postgresql dialect).
- The bundled `docker-compose.yaml` runs `postgres:17-alpine` with a persistent volume; see [self-hosting](/getting-started/self-hosting/).
