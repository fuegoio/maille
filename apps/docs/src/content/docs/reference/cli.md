---
title: CLI commands
description: The maille CLI — every command group and flag, derived from the CLI source.
---

The `maille` CLI (package `@maille/cli`, binary `maille`) manages every Maille entity from the terminal and records bank movements from your machine. Install and authenticate on the [connect the CLI](/getting-started/connect-the-cli/) page.

Global conventions:

- Resource commands come in `list` (`--json` for machine output), `create`, `update <id>`, `delete <id>` (`rm` alias) where applicable.
- IDs are Maille entity ids (get them from `list` commands).
- `maille auth <cmd>` and its top-level shortcuts `maille login` / `maille logout` / `maille whoami` manage the stored session.
- The CLI speaks GraphQL to `{apiUrl}/graphql` with a `Bearer` token; a `401` exits with "Session expired. Run: maille login".

## auth

| Command                         | Flags                             | Description                        |
| ------------------------------- | --------------------------------- | ---------------------------------- |
| `auth login` (alias `signin`)   | `--url <url>`, `--ui-url <uiUrl>` | Browser device-authorization login |
| `auth logout` (alias `signout`) | —                                 | Sign out, clear stored token       |
| `auth whoami`                   | —                                 | Show current user, email, API URL  |

## accounts

| Command                | Flags                                                                                                                                                                                       | Description       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `accounts list`        | `--json`                                                                                                                                                                                    | List accounts     |
| `accounts create`      | `--name` (req), `--type` (req: `bank_account`, `investment_account`, `cash`, `assets`, `liabilities`, `expense`, `revenue`), `--starting-balance`, `--starting-cash-balance`, `--movements` | Create an account |
| `accounts update <id>` | `--name`, `--starting-balance`, `--starting-cash-balance`                                                                                                                                   | Update an account |
| `accounts delete <id>` | —                                                                                                                                                                                           | Delete an account |

## activities, categories, transactions

| Command                                     | Flags                                                                                                                                    | Description                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `activities list`                           | `--json`, `--unreconciled`                                                                                                               | List activities (optionally only unreconciled ones)           |
| `activities get <id>`                       | `--json`                                                                                                                                 | Show one activity with its transactions and links             |
| `activities create`                         | `--name` (req), `--date`, `--description`, `--category`, `--subcategory`, `--project`, `--movement`, `--movement-amount`                 | Create an activity, optionally linking a movement at creation |
| `activities update <id>`                    | `--name`, `--date`, `--description`, `--category`, `--subcategory`, `--project`                                                          | Update an activity                                            |
| `activities delete <id>`                    | —                                                                                                                                        | Delete an activity                                            |
| `categories list`                           | `--json`                                                                                                                                 | List activity categories                                      |
| `categories create`                         | `--name` (req), `--emoji`                                                                                                                | Create a category                                             |
| `categories update <id>`                    | `--name`, `--emoji`                                                                                                                      | Update a category                                             |
| `categories delete <id>`                    | —                                                                                                                                        | Delete a category                                             |
| `transactions list <activity-id>`           | `--json`                                                                                                                                 | List an activity's transactions                               |
| `transactions add <activity-id>`            | `--amount` (req), `--from-account` (req), `--to-account` (req), `--from-asset`, `--to-asset`, `--from-counterparty`, `--to-counterparty` | Add a transaction                                             |
| `transactions update <activity-id> <tx-id>` | `--amount`, `--from-account`, `--to-account`, `--from-asset`, `--to-asset`, `--from-counterparty`, `--to-counterparty`                   | Update a transaction                                          |
| `transactions delete <activity-id> <tx-id>` | —                                                                                                                                        | Delete a transaction                                          |

## movements

| Command                             | Flags                                                                             | Description                                                |
| ----------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `movements list` (alias `movement`) | `--json`, `--unreconciled`                                                        | List movements                                             |
| `movements create`                  | `--name` (req), `--amount` (req), `--account` (req), `--date` (defaults to today) | Record a bank line                                         |
| `movements update <id>`             | `--name`, `--date`, `--amount`, `--account`                                       | Update a movement                                          |
| `movements delete <id>` (`rm`)      | —                                                                                 | Delete a movement                                          |
| `movements link <id>`               | `--activity` (req), `--amount` (req)                                              | Reconcile: link the movement to an activity with an amount |

## funds

| Command             | Flags                                                                         | Description                                          |
| ------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| `funds list`        | `--json`                                                                      | List funds                                           |
| `funds create`      | `--name` (req), `--color` (hex, e.g. `#818cf8`), `--start-date`, `--end-date` | Create a fund                                        |
| `funds update <id>` | `--name`, `--color`, `--start-date`, `--end-date`                             | Update a fund                                        |
| `funds delete <id>` | —                                                                             | Delete a fund                                        |
| `funds allocate`    | `--from` (req), `--to` (req), `--amount` (req), `--date`, `--note`            | Move money between funds (no money changes accounts) |

## assets, counterparties, projects, contacts

| Command                          | Flags                                                            | Description           |
| -------------------------------- | ---------------------------------------------------------------- | --------------------- |
| `assets list`                    | `--json`                                                         | List assets           |
| `assets create`                  | `--name` (req), `--account` (req), `--description`, `--location` | Create an asset       |
| `assets update <id>`             | `--name`, `--account`, `--description`, `--location`             | Update an asset       |
| `assets delete <id>`             | —                                                                | Delete an asset       |
| `counterparties list`            | `--json`                                                         | List counterparties   |
| `counterparties create`          | `--name` (req), `--account` (req), `--description`, `--contact`  | Create a counterparty |
| `counterparties update <id>`     | `--name`, `--description`                                        | Update a counterparty |
| `counterparties delete <id>`     | —                                                                | Delete a counterparty |
| `projects list`                  | `--json`                                                         | List projects         |
| `projects create`                | `--name` (req), `--emoji`, `--start-date`, `--end-date`          | Create a project      |
| `projects update <id>`           | `--name`, `--emoji`, `--start-date`, `--end-date`                | Update a project      |
| `projects delete <id>`           | —                                                                | Delete a project      |
| `contacts list`                  | `--json`                                                         | List contacts         |
| `contacts add <contact-user-id>` | —                                                                | Add a contact         |
| `contacts delete <id>`           | —                                                                | Delete a contact      |
