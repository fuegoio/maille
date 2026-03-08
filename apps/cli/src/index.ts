#!/usr/bin/env node
import { Command } from "commander";
import { authCommand } from "./commands/auth.js";
import {
  activitiesCommand,
  categoriesCommand,
  transactionsCommand,
} from "./commands/activities.js";
import { movementsCommand } from "./commands/movements.js";
import { accountsCommand } from "./commands/accounts.js";
import { assetsCommand } from "./commands/assets.js";
import { counterpartiesCommand } from "./commands/counterparties.js";
import { projectsCommand } from "./commands/projects.js";
import { contactsCommand } from "./commands/contacts.js";

const program = new Command();

program.name("maille").description("CLI for the Maille personal finance API").version("0.1.0");

// Resource commands
program.addCommand(authCommand);
program.addCommand(activitiesCommand);
program.addCommand(categoriesCommand);
program.addCommand(transactionsCommand);
program.addCommand(movementsCommand);
program.addCommand(accountsCommand);
program.addCommand(assetsCommand);
program.addCommand(counterpartiesCommand);
program.addCommand(projectsCommand);
program.addCommand(contactsCommand);

// Top-level shortcuts for common auth commands
program.addCommand(
  new Command("login")
    .description("Log in (shortcut for: maille auth login)")
    .option("--url <url>", "API URL")
    .option("--ui-url <uiUrl>", "UI URL")
    .action(async (opts) => {
      await authCommand.parseAsync(
        [
          "login",
          ...(opts.url ? ["--url", opts.url] : []),
          ...(opts.uiUrl ? ["--ui-url", opts.uiUrl] : []),
        ],
        { from: "user" },
      );
    }),
);

program.addCommand(
  new Command("logout")
    .description("Log out (shortcut for: maille auth logout)")
    .action(async () => {
      await authCommand.parseAsync(["logout"], { from: "user" });
    }),
);

program.addCommand(
  new Command("whoami")
    .description("Show current user (shortcut for: maille auth whoami)")
    .action(async () => {
      await authCommand.parseAsync(["whoami"], { from: "user" });
    }),
);

program.parse();
