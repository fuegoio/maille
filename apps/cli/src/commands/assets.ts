import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { printTable } from "../print.js";
import { gql } from "../client.js";
import { randomUUID } from "node:crypto";

const ASSETS_QUERY = `
  query {
    assets { id name description location account }
  }
`;

export const assetsCommand = new Command("assets")
  .alias("asset")
  .description("Manage assets");

assetsCommand
  .command("list")
  .alias("ls")
  .description("List all assets")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching assets...").start();
    try {
      const data = await gql<{ assets: Record<string, unknown>[] }>(ASSETS_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data.assets, null, 2)); return; }
      if (!data.assets.length) { console.log(chalk.yellow("No assets found.")); return; }
      printTable(
        ["ID", "NAME", "ACCOUNT", "LOCATION", "DESCRIPTION"],
        data.assets.map((a) => [
          String(a.id).slice(0, 8),
          String(a.name),
          String(a.account),
          String(a.location ?? "-"),
          String(a.description ?? "-"),
        ])
      );
    } catch (err) {
      spinner.fail("Failed to fetch assets");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

assetsCommand
  .command("create")
  .description("Create an asset")
  .requiredOption("--name <name>", "Asset name")
  .requiredOption("--account <id>", "Account ID")
  .option("--description <desc>", "Description")
  .option("--location <loc>", "Location")
  .action(async (opts) => {
    const spinner = ora("Creating asset...").start();
    try {
      const data = await gql<{ createAsset: { id: string; name: string } }>(
        `mutation CreateAsset($id: String!, $name: String!, $account: String!, $description: String, $location: String) {
          createAsset(id: $id, name: $name, account: $account, description: $description, location: $location) { id name }
        }`,
        { id: randomUUID(), name: opts.name, account: opts.account, description: opts.description ?? null, location: opts.location ?? null }
      );
      spinner.succeed(`Asset created: ${chalk.cyan(data.createAsset.name)}`);
    } catch (err) {
      spinner.fail("Failed to create asset");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

assetsCommand
  .command("update <id>")
  .description("Update an asset")
  .option("--name <name>", "New name")
  .option("--account <id>", "New account ID")
  .option("--description <desc>", "New description")
  .option("--location <loc>", "New location")
  .action(async (id, opts) => {
    const spinner = ora("Updating asset...").start();
    try {
      const variables: Record<string, unknown> = { id };
      if (opts.name) variables.name = opts.name;
      if (opts.account) variables.account = opts.account;
      if (opts.description) variables.description = opts.description;
      if (opts.location) variables.location = opts.location;
      await gql(
        `mutation UpdateAsset($id: String!, $name: String, $account: String, $description: String, $location: String) {
          updateAsset(id: $id, name: $name, account: $account, description: $description, location: $location) { id name }
        }`,
        variables
      );
      spinner.succeed(`Asset ${chalk.cyan(id)} updated`);
    } catch (err) {
      spinner.fail("Failed to update asset");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

assetsCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete an asset")
  .action(async (id) => {
    const spinner = ora("Deleting asset...").start();
    try {
      await gql(`mutation DeleteAsset($id: String!) { deleteAsset(id: $id) { id success } }`, { id });
      spinner.succeed(`Asset ${chalk.cyan(id)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete asset");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
