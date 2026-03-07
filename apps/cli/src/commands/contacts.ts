import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { printTable } from "../print.js";
import { gql } from "../client.js";
import { randomUUID } from "node:crypto";

const CONTACTS_QUERY = `
  query {
    contacts { id createdAt contact { id name email } }
  }
`;

export const contactsCommand = new Command("contacts")
  .alias("contact")
  .description("Manage contacts");

contactsCommand
  .command("list")
  .alias("ls")
  .description("List all contacts")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching contacts...").start();
    try {
      const data = await gql<{ contacts: Record<string, unknown>[] }>(CONTACTS_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data.contacts, null, 2)); return; }
      if (!data.contacts.length) { console.log(chalk.yellow("No contacts found.")); return; }
      printTable(
        ["ID", "NAME", "EMAIL", "ADDED"],
        data.contacts.map((c) => {
          const u = c.contact as Record<string, unknown>;
          return [
            String(c.id).slice(0, 8),
            String(u.name),
            String(u.email),
            new Date(String(c.createdAt)).toLocaleDateString(),
          ];
        })
      );
    } catch (err) {
      spinner.fail("Failed to fetch contacts");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

contactsCommand
  .command("add <contact-user-id>")
  .description("Add a contact by user ID")
  .action(async (contactUserId) => {
    const spinner = ora("Adding contact...").start();
    try {
      await gql(
        `mutation CreateContact($id: String!, $contact: String!) {
          createContact(id: $id, contact: $contact) { id contact { id name email } }
        }`,
        { id: randomUUID(), contact: contactUserId }
      );
      spinner.succeed(`Contact ${chalk.cyan(contactUserId)} added`);
    } catch (err) {
      spinner.fail("Failed to add contact");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

contactsCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete a contact")
  .action(async (id) => {
    const spinner = ora("Deleting contact...").start();
    try {
      await gql(`mutation { deleteContact(id: "${id}") }`);
      spinner.succeed(`Contact ${chalk.cyan(id)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete contact");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
