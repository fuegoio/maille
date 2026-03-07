import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { printTable } from "../print.js";
import { gql } from "../client.js";
import { randomUUID } from "node:crypto";

const PROJECTS_QUERY = `
  query {
    projects { id name emoji startDate endDate }
  }
`;

export const projectsCommand = new Command("projects")
  .alias("project")
  .description("Manage projects");

projectsCommand
  .command("list")
  .alias("ls")
  .description("List all projects")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const spinner = ora("Fetching projects...").start();
    try {
      const data = await gql<{ projects: Record<string, unknown>[] }>(PROJECTS_QUERY);
      spinner.stop();
      if (opts.json) { console.log(JSON.stringify(data.projects, null, 2)); return; }
      if (!data.projects.length) { console.log(chalk.yellow("No projects found.")); return; }
      printTable(
        ["ID", "NAME", "EMOJI", "START DATE", "END DATE"],
        data.projects.map((p) => [
          String(p.id).slice(0, 8),
          String(p.name),
          String(p.emoji ?? ""),
          p.startDate ? new Date(String(p.startDate)).toLocaleDateString() : "-",
          p.endDate ? new Date(String(p.endDate)).toLocaleDateString() : "-",
        ])
      );
    } catch (err) {
      spinner.fail("Failed to fetch projects");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

projectsCommand
  .command("create")
  .description("Create a project")
  .requiredOption("--name <name>", "Project name")
  .option("--emoji <emoji>", "Emoji")
  .option("--start-date <date>", "Start date (YYYY-MM-DD)")
  .option("--end-date <date>", "End date (YYYY-MM-DD)")
  .action(async (opts) => {
    const spinner = ora("Creating project...").start();
    try {
      const data = await gql<{ createProject: { id: string; name: string } }>(
        `mutation CreateProject($id: String!, $name: String!, $emoji: String) {
          createProject(id: $id, name: $name, emoji: $emoji) { id name }
        }`,
        { id: randomUUID(), name: opts.name, emoji: opts.emoji ?? null }
      );
      spinner.succeed(`Project created: ${chalk.cyan(data.createProject.name)}`);
    } catch (err) {
      spinner.fail("Failed to create project");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

projectsCommand
  .command("update <id>")
  .description("Update a project")
  .option("--name <name>", "New name")
  .option("--emoji <emoji>", "New emoji")
  .option("--start-date <date>", "New start date (YYYY-MM-DD)")
  .option("--end-date <date>", "New end date (YYYY-MM-DD)")
  .action(async (id, opts) => {
    const spinner = ora("Updating project...").start();
    try {
      const variables: Record<string, unknown> = { id };
      if (opts.name) variables.name = opts.name;
      if (opts.emoji) variables.emoji = opts.emoji;
      if (opts.startDate) variables.startDate = opts.startDate;
      if (opts.endDate) variables.endDate = opts.endDate;
      await gql(
        `mutation UpdateProject($id: String!, $name: String, $emoji: String, $startDate: Date, $endDate: Date) {
          updateProject(id: $id, name: $name, emoji: $emoji, startDate: $startDate, endDate: $endDate) { id name }
        }`,
        variables
      );
      spinner.succeed(`Project ${chalk.cyan(id)} updated`);
    } catch (err) {
      spinner.fail("Failed to update project");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

projectsCommand
  .command("delete <id>")
  .alias("rm")
  .description("Delete a project")
  .action(async (id) => {
    const spinner = ora("Deleting project...").start();
    try {
      await gql(`mutation { deleteProject(id: "${id}") }`);
      spinner.succeed(`Project ${chalk.cyan(id)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete project");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
