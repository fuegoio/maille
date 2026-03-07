import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { printTable, formatCurrency } from "../print.js";
import { gql } from "../client.js";
import { randomUUID } from "node:crypto";

const ACTIVITIES_QUERY = `
  query {
    activities {
      id name date type status amount description
      category subcategory project
      transactions { id amount fromAccount toAccount }
    }
  }
`;

const CATEGORIES_QUERY = `
  query {
    activityCategories { id name type emoji }
    activitySubcategories { id name category emoji }
  }
`;

export const activitiesCommand = new Command("activities")
  .alias("activity")
  .description("Manage activities");

activitiesCommand
  .command("list")
  .alias("ls")
  .description("List all activities")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching activities...").start();
    try {
      const data = await gql<{ activities: Record<string, unknown>[] }>(ACTIVITIES_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data.activities, null, 2)); return; }
      if (!data.activities.length) { console.log(chalk.yellow("No activities found.")); return; }
      printTable(
        ["ID", "NAME", "DATE", "TYPE", "AMOUNT", "STATUS", "CATEGORY", "SUBCATEGORY", "PROJECT"],
        data.activities.map((a) => [
          String(a.id).slice(0, 8),
          String(a.name),
          new Date(String(a.date)).toLocaleDateString(),
          String(a.type),
          formatCurrency(Number(a.amount)),
          String(a.status),
          String(a.category ?? "-"),
          String(a.subcategory ?? "-"),
          String(a.project ?? "-"),
        ])
      );
    } catch (err) {
      spinner.fail("Failed to fetch activities");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

activitiesCommand
  .command("get <id>")
  .description("Get activity details (by ID or number)")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    const spinner = ora("Fetching activity...").start();
    try {
      const data = await gql<{ activities: Record<string, unknown>[] }>(ACTIVITIES_QUERY);
      spinner.stop();
      const activity = data.activities.find((a) => a.id === id);
      if (!activity) { console.error(chalk.red(`Activity not found: ${id}`)); process.exit(1); }
      if (opts.json) { console.log(JSON.stringify(activity, null, 2)); return; }
      console.log(`${chalk.bold("ID:")}          ${activity.id}`);
      console.log(`${chalk.bold("Name:")}        ${activity.name}`);
      console.log(`${chalk.bold("Date:")}        ${new Date(String(activity.date)).toLocaleDateString()}`);
      console.log(`${chalk.bold("Type:")}        ${activity.type}`);
      console.log(`${chalk.bold("Status:")}      ${activity.status}`);
      console.log(`${chalk.bold("Amount:")}      ${formatCurrency(Number(activity.amount))}`);
      if (activity.description) console.log(`${chalk.bold("Description:")} ${activity.description}`);
      if (activity.category) console.log(`${chalk.bold("Category:")}    ${activity.category}`);
      if (activity.subcategory) console.log(`${chalk.bold("Subcategory:")} ${activity.subcategory}`);
      if (activity.project) console.log(`${chalk.bold("Project:")}     ${activity.project}`);
      const txs = activity.transactions as Record<string, unknown>[];
      if (txs?.length) {
        console.log(`\n${chalk.bold("Transactions:")}`);
        console.log();
        printTable(
          ["ID", "AMOUNT", "FROM", "TO"],
          txs.map((tx) => [String(tx.id).slice(0, 8), formatCurrency(Number(tx.amount)), String(tx.fromAccount), String(tx.toAccount)])
        );
      }
    } catch (err) {
      spinner.fail("Failed to fetch activity");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

activitiesCommand
  .command("create")
  .description("Create a new activity")
  .requiredOption("--name <name>", "Activity name")
  .requiredOption("--type <type>", "Type: expense|revenue|investment|neutral")
  .hook("preAction", (cmd) => {
    const type = cmd.opts().type as string;
    const valid = ["expense", "revenue", "investment", "neutral"];
    if (!valid.includes(type)) {
      console.error(`error: invalid type '${type}'. Valid values: ${valid.join("|")}`);
      process.exit(1);
    }
  })
  .option("--date <date>", "Date (YYYY-MM-DD), defaults to today")
  .option("--description <desc>", "Description")
  .option("--category <id>", "Category ID")
  .option("--subcategory <id>", "Subcategory ID")
  .option("--project <id>", "Project ID")
  .action(async (opts) => {
    const spinner = ora("Creating activity...").start();
    try {
      const date = opts.date ? opts.date : new Date().toISOString().slice(0, 10);
      const data = await gql<{ createActivity: { id: string; name: string } }>(
        `mutation CreateActivity($id: String!, $name: String!, $date: Date!, $type: String!, $description: String, $category: String, $subcategory: String, $project: String) {
          createActivity(id: $id, name: $name, date: $date, type: $type, description: $description, category: $category, subcategory: $subcategory, project: $project) {
            id name
          }
        }`,
        {
          id: randomUUID(),
          name: opts.name,
          date,
          type: opts.type,
          description: opts.description ?? null,
          category: opts.category ?? null,
          subcategory: opts.subcategory ?? null,
          project: opts.project ?? null,
        }
      );
      spinner.succeed(`Activity created: ${chalk.cyan(data.createActivity.id.slice(0, 8))} ${data.createActivity.name}`);
    } catch (err) {
      spinner.fail("Failed to create activity");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

activitiesCommand
  .command("update <id>")
  .description("Update an activity")
  .option("--name <name>", "New name")
  .option("--date <date>", "New date (YYYY-MM-DD)")
  .option("--description <desc>", "New description")
  .option("--category <id>", "Category ID")
  .option("--subcategory <id>", "Subcategory ID")
  .option("--project <id>", "Project ID")
  .action(async (id, opts) => {
    const spinner = ora("Updating activity...").start();
    try {
      const variables: Record<string, unknown> = { id };
      if (opts.name) variables.name = opts.name;
      if (opts.date) variables.date = opts.date;
      if (opts.description) variables.description = opts.description;
      if (opts.category) variables.category = opts.category;
      if (opts.subcategory) variables.subcategory = opts.subcategory;
      if (opts.project) variables.project = opts.project;
      await gql(
        `mutation UpdateActivity($id: String!, $name: String, $date: Date, $description: String, $category: String, $subcategory: String, $project: String) {
          updateActivity(id: $id, name: $name, date: $date, description: $description, category: $category, subcategory: $subcategory, project: $project) { id name }
        }`,
        variables
      );
      spinner.succeed(`Activity ${chalk.cyan(id)} updated`);
    } catch (err) {
      spinner.fail("Failed to update activity");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

activitiesCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete an activity")
  .action(async (id) => {
    const spinner = ora("Deleting activity...").start();
    try {
      await gql(`mutation DeleteActivity($id: String!) { deleteActivity(id: $id) { id success } }`, { id });
      spinner.succeed(`Activity ${chalk.cyan(id)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete activity");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

// Categories
export const categoriesCommand = new Command("categories")
  .alias("category")
  .description("Manage activity categories");

categoriesCommand
  .command("list")
  .alias("ls")
  .description("List all categories and subcategories")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching categories...").start();
    try {
      const data = await gql<{
        activityCategories: Record<string, unknown>[];
        activitySubcategories: Record<string, unknown>[];
      }>(CATEGORIES_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }
      console.log(chalk.bold("\nCategories"));
      printTable(
        ["ID", "NAME", "TYPE", "EMOJI"],
        data.activityCategories.map((c) => [String(c.id).slice(0, 8), String(c.name), String(c.type), String(c.emoji ?? "")])
      );
      console.log(chalk.bold("\nSubcategories"));
      printTable(
        ["ID", "NAME", "CATEGORY", "EMOJI"],
        data.activitySubcategories.map((s) => [String(s.id).slice(0, 8), String(s.name), String(s.category), String(s.emoji ?? "")])
      );
    } catch (err) {
      spinner.fail("Failed to fetch categories");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

categoriesCommand
  .command("create")
  .description("Create a category")
  .requiredOption("--name <name>", "Category name")
  .requiredOption("--type <type>", "Type: expense|revenue|investment|neutral")
  .hook("preAction", (cmd) => {
    const type = cmd.opts().type as string;
    const valid = ["expense", "revenue", "investment", "neutral"];
    if (!valid.includes(type)) {
      console.error(`error: invalid type '${type}'. Valid values: ${valid.join("|")}`);
      process.exit(1);
    }
  })
  .option("--emoji <emoji>", "Emoji")
  .action(async (opts) => {
    const spinner = ora("Creating category...").start();
    try {
      const data = await gql<{ createActivityCategory: { id: string; name: string } }>(
        `mutation CreateActivityCategory($id: String!, $name: String!, $type: String!, $emoji: String) {
          createActivityCategory(id: $id, name: $name, type: $type, emoji: $emoji) { id name }
        }`,
        { id: randomUUID(), name: opts.name, type: opts.type, emoji: opts.emoji ?? null }
      );
      spinner.succeed(`Category created: ${chalk.cyan(data.createActivityCategory.name)}`);
    } catch (err) {
      spinner.fail("Failed to create category");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

categoriesCommand
  .command("update <id>")
  .description("Update a category")
  .option("--name <name>", "New name")
  .option("--emoji <emoji>", "New emoji")
  .action(async (id, opts) => {
    const spinner = ora("Updating category...").start();
    try {
      const variables: Record<string, unknown> = { id };
      if (opts.name) variables.name = opts.name;
      if (opts.emoji) variables.emoji = opts.emoji;
      await gql(
        `mutation UpdateActivityCategory($id: String!, $name: String, $emoji: String) {
          updateActivityCategory(id: $id, name: $name, emoji: $emoji) { id name }
        }`,
        variables
      );
      spinner.succeed(`Category ${chalk.cyan(id)} updated`);
    } catch (err) {
      spinner.fail("Failed to update category");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

categoriesCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete a category")
  .action(async (id) => {
    const spinner = ora("Deleting...").start();
    try {
      await gql(`mutation DeleteActivityCategory($id: String!) { deleteActivityCategory(id: $id) { id success } }`, { id });
      spinner.succeed("Category deleted");
    } catch (err) {
      spinner.fail("Failed");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

// Transactions subcommand
export const transactionsCommand = new Command("transactions")
  .alias("transaction")
  .description("Manage activity transactions");

transactionsCommand
  .command("list <activity-id>")
  .alias("ls")
  .description("List transactions for an activity (by ID or number)")
  .option("--json", "Output as JSON")
  .action(async (activityId, opts) => {
    const spinner = ora("Fetching transactions...").start();
    try {
      const data = await gql<{ activities: Record<string, unknown>[] }>(ACTIVITIES_QUERY);
      spinner.stop();
      const activity = data.activities.find((a) => a.id === activityId);
      if (!activity) { console.error(chalk.red(`Activity not found: ${activityId}`)); process.exit(1); }
      const txs = activity.transactions as Record<string, unknown>[];
      if (opts.json) { console.log(JSON.stringify(txs, null, 2)); return; }
      if (!txs?.length) { console.log(chalk.yellow("No transactions found.")); return; }
      printTable(
        ["ID", "AMOUNT", "FROM ACCOUNT", "TO ACCOUNT", "FROM ASSET", "TO ASSET", "FROM COUNTERPARTY", "TO COUNTERPARTY"],
        txs.map((tx) => [
          String(tx.id).slice(0, 8),
          formatCurrency(Number(tx.amount)),
          String(tx.fromAccount),
          String(tx.toAccount),
          String(tx.fromAsset ?? "-"),
          String(tx.toAsset ?? "-"),
          String(tx.fromCounterparty ?? "-"),
          String(tx.toCounterparty ?? "-"),
        ])
      );
    } catch (err) {
      spinner.fail("Failed to fetch transactions");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

transactionsCommand
  .command("add <activity-id>")
  .description("Add a transaction to an activity")
  .requiredOption("--amount <amount>", "Amount")
  .requiredOption("--from-account <id>", "From account ID")
  .requiredOption("--to-account <id>", "To account ID")
  .option("--from-asset <id>", "From asset ID")
  .option("--to-asset <id>", "To asset ID")
  .option("--from-counterparty <id>", "From counterparty ID")
  .option("--to-counterparty <id>", "To counterparty ID")
  .action(async (activityId, opts) => {
    const spinner = ora("Adding transaction...").start();
    try {
      const data = await gql<{ addTransaction: { id: string; amount: number } }>(
        `mutation AddTransaction($id: String!, $activityId: String!, $amount: Float!, $fromAccount: String!, $toAccount: String!, $fromAsset: String, $toAsset: String, $fromCounterparty: String, $toCounterparty: String) {
          addTransaction(id: $id, activityId: $activityId, amount: $amount, fromAccount: $fromAccount, toAccount: $toAccount, fromAsset: $fromAsset, toAsset: $toAsset, fromCounterparty: $fromCounterparty, toCounterparty: $toCounterparty) {
            id amount
          }
        }`,
        {
          id: randomUUID(),
          activityId,
          amount: Number(opts.amount),
          fromAccount: opts.fromAccount,
          toAccount: opts.toAccount,
          fromAsset: opts.fromAsset ?? null,
          toAsset: opts.toAsset ?? null,
          fromCounterparty: opts.fromCounterparty ?? null,
          toCounterparty: opts.toCounterparty ?? null,
        }
      );
      spinner.succeed(`Transaction added: ${chalk.cyan(data.addTransaction.id.slice(0, 8))} ${formatCurrency(data.addTransaction.amount)}`);
    } catch (err) {
      spinner.fail("Failed to add transaction");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

transactionsCommand
  .command("update <activity-id> <transaction-id>")
  .description("Update a transaction")
  .option("--amount <amount>", "New amount")
  .option("--from-account <id>", "New from account ID")
  .option("--to-account <id>", "New to account ID")
  .option("--from-asset <id>", "New from asset ID")
  .option("--to-asset <id>", "New to asset ID")
  .option("--from-counterparty <id>", "New from counterparty ID")
  .option("--to-counterparty <id>", "New to counterparty ID")
  .action(async (activityId, transactionId, opts) => {
    const spinner = ora("Updating transaction...").start();
    try {
      const variables: Record<string, unknown> = { id: transactionId, activityId };
      if (opts.amount) variables.amount = Number(opts.amount);
      if (opts.fromAccount) variables.fromAccount = opts.fromAccount;
      if (opts.toAccount) variables.toAccount = opts.toAccount;
      if (opts.fromAsset) variables.fromAsset = opts.fromAsset;
      if (opts.toAsset) variables.toAsset = opts.toAsset;
      if (opts.fromCounterparty) variables.fromCounterparty = opts.fromCounterparty;
      if (opts.toCounterparty) variables.toCounterparty = opts.toCounterparty;
      await gql(
        `mutation UpdateTransaction($id: String!, $activityId: String!, $amount: Float, $fromAccount: String, $toAccount: String, $fromAsset: String, $toAsset: String, $fromCounterparty: String, $toCounterparty: String) {
          updateTransaction(id: $id, activityId: $activityId, amount: $amount, fromAccount: $fromAccount, toAccount: $toAccount, fromAsset: $fromAsset, toAsset: $toAsset, fromCounterparty: $fromCounterparty, toCounterparty: $toCounterparty) {
            id amount
          }
        }`,
        variables
      );
      spinner.succeed(`Transaction ${chalk.cyan(transactionId.slice(0, 8))} updated`);
    } catch (err) {
      spinner.fail("Failed to update transaction");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

transactionsCommand
  .command("delete <activity-id> <transaction-id>")
  .alias("rm")
  .description("Delete a transaction")
  .action(async (activityId, transactionId) => {
    const spinner = ora("Deleting transaction...").start();
    try {
      await gql(
        `mutation DeleteTransaction($id: String!, $activityId: String!) { deleteTransaction(id: $id, activityId: $activityId) { id success } }`,
        { id: transactionId, activityId }
      );
      spinner.succeed(`Transaction ${chalk.cyan(transactionId.slice(0, 8))} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete transaction");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
