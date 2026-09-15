---
title: Connect the CLI
description: Install the maille CLI and authenticate with your instance via device authorization.
---

The `maille` CLI runs on your own machine. It authenticates against your API instance, records bank movements into it, and lets you manage every ledger entity from the terminal. See the [CLI reference](/reference/cli/) for the full command list.

## Install

The CLI is the `@maille/cli` workspace package; it builds to a single `dist/maille.js` entry:

```bash
cd apps/cli
bun run build   # produces dist/maille.js (node target)
bun install -g . # or run the file directly / link it into your PATH
```

The `maille` command requires Node or Bun on the machine it runs on.

## Log in

```bash
maille login --url https://your-instance.example.com/api --ui-url https://your-instance.example.com
```

The login uses better-auth's device authorization flow:

1. The CLI requests a device code from your API.
2. It prints the verification URL and a user code (displayed as `XXXX-XXXX`) and opens your browser at `{ui-url}/device?user_code=...`.
3. You confirm the code in the web UI.
4. The CLI polls for the token (respecting the server's `interval`, honoring `slow_down`), then fetches your session and stores it.

Without flags, `maille login` uses the URLs already stored in the config file. Verify with:

```bash
maille whoami   # user, email, API URL
```

## Configuration file

Everything the CLI knows about your instance lives in `~/.maille/config.json` (mode `600`):

```json
{
  "apiUrl": "https://your-instance.example.com/api",
  "uiUrl": "https://your-instance.example.com",
  "token": "<bearer token>",
  "user": { "id": "...", "name": "...", "email": "...", "currency": "EUR" }
}
```

`maille logout` revokes the session (best-effort) and clears the stored token and user.

## Next steps

- [Record your bank movements](/guides/bank-sync/) from your machine.
- Walk the [CLI commands](/reference/cli/) — every ledger entity is manageable from the shell.
