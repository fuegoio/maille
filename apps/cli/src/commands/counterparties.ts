import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { printTable } from "../print.js";
import { gql } from "../client.js";
import { randomUUID } from "node:crypto";

const COUNTERPARTIES_QUERY = `
  query {
    counterparties { id name description account contact }
  }
`;

export const counterpartiesCommand = new Command("counterparties")
  .alias("counterparty")
  .description("Manage counterparties");

counterpartiesCommand
  .command("list")
  .alias("ls")
  .description("List all counterparties")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching counterparties...").start();
    try {
      const data = await gql<{ counterparties: Record<string, unknown>[] }>(COUNTERPARTIES_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data.counterparties, null, 2)); return; }
      if (!data.counterparties.length) { console.log(chalk.yellow("No counterparties found.")); return; }
      printTable(
        ["ID", "NAME", "ACCOUNT", "DESCRIPTION", "CONTACT"],
        data.counterparties.map((c) => [
          String(c.id).slice(0, 8),
          String(c.name),
          String(c.account),
          String(c.description ?? "-"),
          String(c.contact ?? "-"),
        ])
      );
    } catch (err) {
      spinner.fail("Failed to fetch counterparties");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

counterpartiesCommand
  .command("create")
  .description("Create a counterparty")
  .requiredOption("--name <name>", "Counterparty name")
  .requiredOption("--account <id>", "Account ID")
  .option("--description <desc>", "Description")
  .option("--contact <id>", "Contact user ID")
  .action(async (opts) => {
    const spinner = ora("Creating counterparty...").start();
    try {
      const data = await gql<{ createCounterparty: { id: string; name: string } }>(
        `mutation CreateCounterparty($id: String!, $name: String!, $account: String!, $description: String, $contact: String) {
          createCounterparty(id: $id, name: $name, account: $account, description: $description, contact: $contact) { id name }
        }`,
        { id: randomUUID(), name: opts.name, account: opts.account, description: opts.description ?? null, contact: opts.contact ?? null }
      );
      spinner.succeed(`Counterparty created: ${chalk.cyan(data.createCounterparty.name)}`);
    } catch (err) {
      spinner.fail("Failed to create counterparty");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

counterpartiesCommand
  .command("update <id>")
  .description("Update a counterparty")
  .option("--name <name>", "New name")
  .option("--description <desc>", "New description")
  .action(async (id, opts) => {
    const spinner = ora("Updating counterparty...").start();
    try {
      const variables: Record<string, unknown> = { id };
      if (opts.name) variables.name = opts.name;
      if (opts.description) variables.description = opts.description;
      await gql(
        `mutation UpdateCounterparty($id: String!, $name: String, $description: String) {
          updateCounterparty(id: $id, name: $name, description: $description) { id name }
        }`,
        variables
      );
      spinner.succeed(`Counterparty ${chalk.cyan(id)} updated`);
    } catch (err) {
      spinner.fail("Failed to update counterparty");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

counterpartiesCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete a counterparty")
  .action(async (id) => {
    const spinner = ora("Deleting counterparty...").start();
    try {
      await gql(`mutation { deleteCounterparty(id: "${id}") }`);
      spinner.succeed(`Counterparty ${chalk.cyan(id)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete counterparty");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
