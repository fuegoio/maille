import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { readConfig, writeConfig, clearAuth } from "../config.js";

interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  currency?: string;
}

interface BetterAuthSignInResponse {
  token: string;
  redirect?: boolean;
  user: BetterAuthUser;
}

interface BetterAuthSignUpResponse {
  token?: string;
  session?: { token: string };
  user: BetterAuthUser;
}

interface BetterAuthError {
  message?: string;
  error?: string;
}

export const authCommand = new Command("auth").description("Authentication commands");

authCommand
  .command("login")
  .alias("signin")
  .description("Log in to your Maille account")
  .requiredOption("--email <email>", "Email address")
  .requiredOption("--password <password>", "Password")
  .option("--url <url>", "API URL", "http://localhost:3000")
  .action(async (opts) => {
    const config = readConfig();
    const apiUrl = opts.url ?? config.apiUrl;
    const spinner = ora("Signing in...").start();
    try {
      const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: opts.email, password: opts.password }),
      });
      const data = (await response.json()) as BetterAuthSignInResponse & BetterAuthError;
      if (!response.ok) {
        spinner.fail("Login failed");
        console.error(chalk.red(data.message ?? data.error ?? "Unknown error"));
        process.exit(1);
      }
      writeConfig({ apiUrl, token: data.token, user: { id: data.user.id, name: data.user.name, email: data.user.email, currency: data.user.currency ?? "EUR" } });
      spinner.succeed(`Logged in as ${chalk.cyan(data.user.email)}`);
    } catch (err) {
      spinner.fail("Login failed");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

authCommand
  .command("logout")
  .alias("signout")
  .description("Log out of your Maille account")
  .action(async () => {
    const config = readConfig();
    if (!config.token) { console.log("Not logged in."); return; }
    const spinner = ora("Signing out...").start();
    try {
      await fetch(`${config.apiUrl}/api/auth/sign-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.token}` },
      });
    } catch { /* best-effort */ }
    clearAuth();
    spinner.succeed("Logged out");
  });

authCommand
  .command("whoami")
  .description("Show current authenticated user")
  .action(() => {
    const config = readConfig();
    if (!config.token || !config.user) {
      console.log(chalk.yellow("Not logged in. Run: maille auth login --email <email> --password <password>"));
      return;
    }
    console.log(`${chalk.bold("User:")}  ${config.user.name}`);
    console.log(`${chalk.bold("Email:")} ${config.user.email}`);
    console.log(`${chalk.bold("API:")}   ${config.apiUrl}`);
  });

authCommand
  .command("register")
  .description("Create a new Maille account")
  .requiredOption("--name <name>", "Full name")
  .requiredOption("--email <email>", "Email address")
  .requiredOption("--password <password>", "Password (min 8 chars, 1 special, 1 number)")
  .option("--url <url>", "API URL", "http://localhost:3000")
  .action(async (opts) => {
    const config = readConfig();
    const apiUrl = opts.url ?? config.apiUrl;
    const spinner = ora("Creating account...").start();
    try {
      const response = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: opts.name, email: opts.email, password: opts.password }),
      });
      const data = (await response.json()) as BetterAuthSignUpResponse & BetterAuthError;
      if (!response.ok) {
        spinner.fail("Registration failed");
        console.error(chalk.red(data.message ?? data.error ?? "Unknown error"));
        process.exit(1);
      }
      const token = data.token ?? data.session?.token;
      if (!token) { spinner.fail("Registration failed: no token in response"); process.exit(1); }
      writeConfig({ apiUrl, token, user: { id: data.user.id, name: data.user.name, email: data.user.email, currency: data.user.currency ?? "EUR" } });
      spinner.succeed(`Account created and logged in as ${chalk.cyan(data.user.email)}`);
    } catch (err) {
      spinner.fail("Registration failed");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
