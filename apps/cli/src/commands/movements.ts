import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { printTable, formatCurrency } from "../print.js";
import { gql } from "../client.js";
import { randomUUID } from "node:crypto";

const MOVEMENTS_QUERY = `
  query {
    movements { id name date amount account activities { id } }
  }
`;

export const movementsCommand = new Command("movements")
  .alias("movement")
  .description("Manage movements");

movementsCommand
  .command("list")
  .alias("ls")
  .description("List all movements")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching movements...").start();
    try {
      const data = await gql<{ movements: Record<string, unknown>[] }>(MOVEMENTS_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data.movements, null, 2)); return; }
      if (!data.movements.length) { console.log(chalk.yellow("No movements found.")); return; }
      printTable(
        ["ID", "NAME", "DATE", "AMOUNT", "ACCOUNT", "ACTIVITIES"],
        data.movements.map((m) => [
          String(m.id).slice(0, 8),
          String(m.name),
          new Date(String(m.date)).toLocaleDateString(),
          formatCurrency(Number(m.amount)),
          String(m.account),
          String((m.activities as unknown[])?.length ?? 0),
        ])
      );
    } catch (err) {
      spinner.fail("Failed to fetch movements");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

movementsCommand
  .command("create")
  .description("Create a movement")
  .requiredOption("--name <name>", "Movement name")
  .requiredOption("--amount <amount>", "Amount")
  .requiredOption("--account <id>", "Account ID")
  .option("--date <date>", "Date (YYYY-MM-DD), defaults to today")
  .action(async (opts) => {
    const spinner = ora("Creating movement...").start();
    try {
      const date = opts.date ? opts.date : new Date().toISOString().slice(0, 10);
      const data = await gql<{ createMovement: { id: string; name: string } }>(
        `mutation CreateMovement($id: String!, $name: String!, $date: Date!, $amount: Float!, $account: String!) {
          createMovement(id: $id, name: $name, date: $date, amount: $amount, account: $account) { id name }
        }`,
        { id: randomUUID(), name: opts.name, date, amount: Number(opts.amount), account: opts.account }
      );
      spinner.succeed(`Movement created: ${chalk.cyan(data.createMovement.name)}`);
    } catch (err) {
      spinner.fail("Failed to create movement");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

movementsCommand
  .command("update <id>")
  .description("Update a movement")
  .option("--name <name>", "New name")
  .option("--date <date>", "New date (YYYY-MM-DD)")
  .option("--amount <amount>", "New amount")
  .option("--account <id>", "New account ID")
  .action(async (id, opts) => {
    const spinner = ora("Updating movement...").start();
    try {
      const variables: Record<string, unknown> = { id };
      if (opts.name) variables.name = opts.name;
      if (opts.date) variables.date = opts.date;
      if (opts.amount) variables.amount = Number(opts.amount);
      if (opts.account) variables.account = opts.account;
      await gql(
        `mutation UpdateMovement($id: String!, $name: String, $date: Date, $amount: Float, $account: String) {
          updateMovement(id: $id, name: $name, date: $date, amount: $amount, account: $account) { id name }
        }`,
        variables
      );
      spinner.succeed(`Movement ${chalk.cyan(id)} updated`);
    } catch (err) {
      spinner.fail("Failed to update movement");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

movementsCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete a movement")
  .action(async (id) => {
    const spinner = ora("Deleting movement...").start();
    try {
      await gql(`mutation DeleteMovement($id: String!) { deleteMovement(id: $id) { id success } }`, { id });
      spinner.succeed(`Movement ${chalk.cyan(id)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete movement");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
