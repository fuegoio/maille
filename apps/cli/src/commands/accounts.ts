import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { printTable, formatCurrency } from "../print.js";
import { gql } from "../client.js";
import { randomUUID } from "node:crypto";

const ACCOUNTS_QUERY = `
  query {
    accounts { id name type default startingBalance startingCashBalance movements sharing { role sharedWith proportion } }
  }
`;

export const accountsCommand = new Command("accounts")
  .alias("account")
  .description("Manage accounts");

accountsCommand
  .command("list")
  .alias("ls")
  .description("List all accounts")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching accounts...").start();
    try {
      const data = await gql<{ accounts: Record<string, unknown>[] }>(ACCOUNTS_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data.accounts, null, 2)); return; }
      if (!data.accounts.length) { console.log(chalk.yellow("No accounts found.")); return; }
      printTable(
        ["ID", "NAME", "TYPE", "DEFAULT", "STARTING BALANCE", "MOVEMENTS", "SHARED"],
        data.accounts.map((a) => [
          String(a.id).slice(0, 8),
          String(a.name),
          String(a.type),
          a.default ? "yes" : "no",
          a.startingBalance != null ? formatCurrency(Number(a.startingBalance)) : "-",
          a.movements ? "yes" : "no",
          String((a.sharing as unknown[])?.length > 1 ? "yes" : "no"),
        ])
      );
    } catch (err) {
      spinner.fail("Failed to fetch accounts");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

accountsCommand
  .command("create")
  .description("Create an account")
  .requiredOption("--name <name>", "Account name")
  .requiredOption("--type <type>", "Type: bank_account|investment_account|cash|assets|liabilities|expense|revenue")
  .hook("preAction", (cmd) => {
    const type = cmd.opts().type as string;
    const valid = ["bank_account", "investment_account", "cash", "assets", "liabilities", "expense", "revenue"];
    if (!valid.includes(type)) {
      console.error(`error: invalid type '${type}'. Valid values: ${valid.join("|")}`);
      process.exit(1);
    }
  })
  .option("--starting-balance <amount>", "Starting balance")
  .option("--starting-cash-balance <amount>", "Starting cash balance")
  .option("--movements", "Enable movements tracking")
  .action(async (opts) => {
    const spinner = ora("Creating account...").start();
    try {
      const data = await gql<{ createAccount: { id: string; name: string } }>(
        `mutation CreateAccount($id: String!, $name: String!, $type: String!, $startingBalance: Float, $startingCashBalance: Float, $movements: Boolean) {
          createAccount(id: $id, name: $name, type: $type, startingBalance: $startingBalance, startingCashBalance: $startingCashBalance, movements: $movements) { id name }
        }`,
        {
          id: randomUUID(),
          name: opts.name,
          type: opts.type,
          startingBalance: opts.startingBalance != null ? Number(opts.startingBalance) : null,
          startingCashBalance: opts.startingCashBalance != null ? Number(opts.startingCashBalance) : null,
          movements: opts.movements ?? false,
        }
      );
      spinner.succeed(`Account created: ${chalk.cyan(data.createAccount.name)}`);
    } catch (err) {
      spinner.fail("Failed to create account");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

accountsCommand
  .command("update <id>")
  .description("Update an account")
  .option("--name <name>", "New name")
  .option("--starting-balance <amount>", "New starting balance")
  .option("--starting-cash-balance <amount>", "New starting cash balance")
  .action(async (id, opts) => {
    const spinner = ora("Updating account...").start();
    try {
      const variables: Record<string, unknown> = { id };
      if (opts.name) variables.name = opts.name;
      if (opts.startingBalance != null) variables.startingBalance = Number(opts.startingBalance);
      if (opts.startingCashBalance != null) variables.startingCashBalance = Number(opts.startingCashBalance);
      await gql(
        `mutation UpdateAccount($id: String!, $name: String, $startingBalance: Float, $startingCashBalance: Float) {
          updateAccount(id: $id, name: $name, startingBalance: $startingBalance, startingCashBalance: $startingCashBalance) { id name }
        }`,
        variables
      );
      spinner.succeed(`Account ${chalk.cyan(id)} updated`);
    } catch (err) {
      spinner.fail("Failed to update account");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

accountsCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete an account")
  .action(async (id) => {
    const spinner = ora("Deleting account...").start();
    try {
      await gql(`mutation DeleteAccount($id: String!) { deleteAccount(id: $id) { id success } }`, { id });
      spinner.succeed(`Account ${chalk.cyan(id)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete account");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
