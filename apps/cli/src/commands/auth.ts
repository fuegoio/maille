import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { spawn } from "node:child_process";
import { readConfig, writeConfig, clearAuth } from "../config.js";
import { createCliAuthClient } from "../client-auth.js";

const CLIENT_ID = "maille-cli";

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  const child = spawn(cmd, [url], { detached: true, stdio: "ignore" });
  child.unref();
}

async function pollForToken(
  authClient: ReturnType<typeof createCliAuthClient>,
  deviceCode: string,
  intervalSecs: number,
  expiresIn: number,
): Promise<string> {
  let pollingInterval = intervalSecs;
  const deadline = Date.now() + expiresIn * 1000;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      if (Date.now() > deadline) {
        reject(new Error("Device code expired. Please run `maille login` again."));
        return;
      }

      const { data, error } = await authClient.device.token({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: deviceCode,
        client_id: CLIENT_ID,
      });

      if (data?.access_token) {
        resolve(data.access_token);
        return;
      }

      if (error) {
        switch (error.error) {
          case "authorization_pending":
            break;
          case "slow_down":
            pollingInterval += 5;
            break;
          case "access_denied":
            reject(new Error("Authorization denied."));
            return;
          case "expired_token":
            reject(new Error("Device code expired. Please run `maille login` again."));
            return;
          default:
            reject(new Error(error.error_description ?? error.error ?? "Unknown error"));
            return;
        }
      }

      setTimeout(poll, pollingInterval * 1000);
    };

    setTimeout(poll, pollingInterval * 1000);
  });
}

export const authCommand = new Command("auth").description("Authentication commands");

authCommand
  .command("login")
  .alias("signin")
  .description("Log in to your Maille account via browser")
  .option("--url <url>", "API URL")
  .option("--ui-url <uiUrl>", "UI URL")
  .action(async (opts) => {
    const config = readConfig();
    const apiUrl = opts.url ?? config.apiUrl;
    const uiUrl = opts.uiUrl ?? config.uiUrl ?? "https://maille.alexistac.net";

    const authClient = createCliAuthClient(apiUrl);

    // 1. Request device code
    const { data: deviceData, error: deviceError } = await authClient.device.code({
      client_id: CLIENT_ID,
    });

    if (deviceError || !deviceData) {
      console.error(
        chalk.red(
          `Failed to start login: ${deviceError?.error_description ?? deviceError?.error ?? "Unknown error"}`,
        ),
      );
      process.exit(1);
    }

    const { device_code, user_code, interval, expires_in } = deviceData;

    // 2. Display instructions
    const verifyUrl = `${uiUrl}/device?user_code=${user_code}`;
    const displayCode =
      user_code.length === 8 ? `${user_code.slice(0, 4)}-${user_code.slice(4)}` : user_code;

    console.log();
    console.log(`  ${chalk.bold("Visit:")}  ${chalk.cyan(`${uiUrl}/device`)}`);
    console.log(`  ${chalk.bold("Code:")}   ${chalk.yellow.bold(displayCode)}`);
    console.log();

    // 3. Open browser
    openBrowser(verifyUrl);

    // 4. Poll for token
    const spinner = ora("Waiting for authorization...").start();

    let accessToken: string;
    try {
      accessToken = await pollForToken(authClient, device_code, interval, expires_in);
    } catch (err) {
      spinner.fail("Authorization failed");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }

    spinner.text = "Fetching session...";

    // 5. Fetch user info
    const { data: session, error: sessionError } = await authClient.getSession({
      fetchOptions: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    if (sessionError || !session?.user) {
      spinner.fail("Failed to fetch session");
      console.error(chalk.red(sessionError?.message ?? "No session returned"));
      process.exit(1);
    }

    writeConfig({
      apiUrl,
      uiUrl,
      token: accessToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        currency: (session.user as { currency?: string }).currency ?? "EUR",
      },
    });

    spinner.succeed(`Logged in as ${chalk.cyan(session.user.email)}`);
  });

authCommand
  .command("logout")
  .alias("signout")
  .description("Log out of your Maille account")
  .action(async () => {
    const config = readConfig();
    if (!config.token) {
      console.log("Not logged in.");
      return;
    }
    const spinner = ora("Signing out...").start();
    const authClient = createCliAuthClient(config.apiUrl);
    try {
      await authClient.signOut({
        fetchOptions: { headers: { Authorization: `Bearer ${config.token}` } },
      });
    } catch {
      /* best-effort */
    }
    clearAuth();
    spinner.succeed("Logged out");
  });

authCommand
  .command("whoami")
  .description("Show current authenticated user")
  .action(() => {
    const config = readConfig();
    if (!config.token || !config.user) {
      console.log(chalk.yellow("Not logged in. Run: maille login"));
      return;
    }
    console.log(`${chalk.bold("User:")}  ${config.user.name}`);
    console.log(`${chalk.bold("Email:")} ${config.user.email}`);
    console.log(`${chalk.bold("API:")}   ${config.apiUrl}`);
  });
