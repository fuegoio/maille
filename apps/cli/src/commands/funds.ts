import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { printTable } from "../print.js";
import { gql } from "../client.js";
import { randomUUID } from "node:crypto";

const FUNDS_QUERY = `
  query {
    funds { id name color startDate endDate }
  }
`;

export const fundsCommand = new Command("funds")
  .alias("fund")
  .description("Manage funds (what the money is for)");

fundsCommand
  .command("list")
  .alias("ls")
  .description("List all funds")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching funds...").start();
    try {
      const data = await gql<{ funds: Record<string, unknown>[] }>(FUNDS_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data.funds, null, 2)); return; }
      if (!data.funds.length) { console.log(chalk.yellow("No funds found.")); return; }
      printTable(
        ["ID", "NAME", "COLOR", "START DATE", "END DATE"],
        data.funds.map((f) => [
          String(f.id).slice(0, 8),
          String(f.name),
          String(f.color ?? ""),
          f.startDate ? new Date(String(f.startDate)).toLocaleDateString() : "-",
          f.endDate ? new Date(String(f.endDate)).toLocaleDateString() : "-",
        ])
      );
    } catch (err) {
      spinner.fail("Failed to fetch funds");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

fundsCommand
  .command("create")
  .description("Create a fund")
  .requiredOption("--name <name>", "Fund name")
  .option("--color <color>", "Color (hex, e.g. #818cf8)")
  .option("--start-date <date>", "Start date (YYYY-MM-DD)")
  .option("--end-date <date>", "End date (YYYY-MM-DD)")
  .action(async (opts) => {
    const spinner = ora("Creating fund...").start();
    try {
      const data = await gql<{ createFund: { id: string; name: string } }>(
        `mutation CreateFund($id: String!, $name: String!, $color: String, $startDate: Date, $endDate: Date) {
          createFund(id: $id, name: $name, color: $color, startDate: $startDate, endDate: $endDate) { id name }
        }`,
        {
          id: randomUUID(),
          name: opts.name,
          color: opts.color ?? null,
          startDate: opts.startDate ?? null,
          endDate: opts.endDate ?? null,
        }
      );
      spinner.succeed(`Fund created: ${chalk.cyan(data.createFund.name)}`);
    } catch (err) {
      spinner.fail("Failed to create fund");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

fundsCommand
  .command("update <id>")
  .description("Update a fund")
  .option("--name <name>", "New name")
  .option("--color <color>", "New color (hex, e.g. #818cf8)")
  .option("--start-date <date>", "New start date (YYYY-MM-DD)")
  .option("--end-date <date>", "New end date (YYYY-MM-DD)")
  .action(async (id, opts) => {
    const spinner = ora("Updating fund...").start();
    try {
      const variables: Record<string, unknown> = { id };
      if (opts.name) variables.name = opts.name;
      if (opts.color) variables.color = opts.color;
      if (opts.startDate) variables.startDate = opts.startDate;
      if (opts.endDate) variables.endDate = opts.endDate;
      await gql(
        `mutation UpdateFund($id: String!, $name: String, $color: String, $startDate: Date, $endDate: Date) {
          updateFund(id: $id, name: $name, color: $color, startDate: $startDate, endDate: $endDate) { id name }
        }`,
        variables
      );
      spinner.succeed(`Fund ${chalk.cyan(id)} updated`);
    } catch (err) {
      spinner.fail("Failed to update fund");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

fundsCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete a fund")
  .action(async (id) => {
    const spinner = ora("Deleting fund...").start();
    try {
      await gql(`mutation { deleteFund(id: "${id}") }`);
      spinner.succeed(`Fund ${chalk.cyan(id)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete fund");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

fundsCommand
  .command("allocate")
  .description("Move money between funds (no money changes accounts)")
  .requiredOption("--from <fundId>", "Source fund id")
  .requiredOption("--to <fundId>", "Destination fund id")
  .requiredOption("--amount <amount>", "Amount")
  .option("--date <date>", "Date (YYYY-MM-DD, default today)")
  .option("--note <note>", "Note")
  .action(async (opts) => {
    const spinner = ora("Allocating...").start();
    try {
      await gql(
        `mutation CreateFundMove($id: String!, $fromFund: String, $toFund: String, $amount: Float!, $date: Date, $note: String) {
          createFundMove(id: $id, fromFund: $fromFund, toFund: $toFund, amount: $amount, date: $date, note: $note) { id }
        }`,
        {
          id: randomUUID(),
          fromFund: opts.from,
          toFund: opts.to,
          amount: parseFloat(opts.amount),
          date: opts.date ?? new Date().toISOString().split("T")[0],
          note: opts.note ?? null,
        }
      );
      spinner.succeed(`Allocated ${chalk.cyan(opts.amount)} from ${chalk.cyan(opts.from)} to ${chalk.cyan(opts.to)}`);
    } catch (err) {
      spinner.fail("Failed to allocate");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
