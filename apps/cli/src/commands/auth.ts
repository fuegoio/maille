import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { spawn } from "node:child_process";
import { readConfig, writeConfig, clearAuth } from "../config.js";

const CLIENT_ID = "maille-cli";
const GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

interface DeviceTokenResponse {
  access_token?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  currency?: string;
}

interface SessionResponse {
  session: { token: string };
  user: BetterAuthUser;
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  const child = spawn(cmd, [url], { detached: true, stdio: "ignore" });
  child.unref();
}

async function pollForToken(
  apiUrl: string,
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

      try {
        const res = await fetch(`${apiUrl}/api/auth/device/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: GRANT_TYPE,
            device_code: deviceCode,
            client_id: CLIENT_ID,
          }),
        });

        const data = (await res.json()) as DeviceTokenResponse;

        if (data.access_token) {
          resolve(data.access_token);
          return;
        }

        switch (data.error) {
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
            reject(new Error(data.error_description ?? data.error ?? "Unknown error"));
            return;
        }
      } catch (err) {
        reject(new Error(`Network error: ${err instanceof Error ? err.message : String(err)}`));
        return;
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

    // 1. Request device code
    let deviceData: DeviceCodeResponse;
    try {
      const res = await fetch(`${apiUrl}/api/auth/device/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        console.error(chalk.red(`Failed to start login: ${err.message ?? res.statusText}`));
        process.exit(1);
      }
      deviceData = (await res.json()) as DeviceCodeResponse;
    } catch (err) {
      console.error(
        chalk.red(`Network error: ${err instanceof Error ? err.message : String(err)}`),
      );
      process.exit(1);
    }

    const { device_code, user_code, interval = 5, expires_in = 1800 } = deviceData;

    // 2. Display instructions
    const verifyUrl = `${uiUrl}/device?user_code=${user_code}`;
    console.log();
    console.log(`  ${chalk.bold("Visit:")}  ${chalk.cyan(uiUrl + "/device")}`);
    console.log(
      `  ${chalk.bold("Code:")}   ${chalk.yellow.bold(user_code.length === 8 ? `${user_code.slice(0, 4)}-${user_code.slice(4)}` : user_code)}`,
    );
    console.log();

    // 3. Open browser
    openBrowser(verifyUrl);

    // 4. Poll
    const spinner = ora("Waiting for authorization...").start();

    let accessToken: string;
    try {
      accessToken = await pollForToken(apiUrl, device_code, interval, expires_in);
    } catch (err) {
      spinner.fail("Authorization failed");
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }

    spinner.text = "Fetching session...";

    // 5. Fetch user info from session
    try {
      const res = await fetch(`${apiUrl}/api/auth/get-session`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = (await res.json()) as SessionResponse;

      writeConfig({
        apiUrl,
        uiUrl,
        token: accessToken,
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          currency: data.user.currency ?? "EUR",
        },
      });

      spinner.succeed(`Logged in as ${chalk.cyan(data.user.email)}`);
    } catch (err) {
      spinner.fail("Failed to fetch session");
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
    if (!config.token) {
      console.log("Not logged in.");
      return;
    }
    const spinner = ora("Signing out...").start();
    try {
      await fetch(`${config.apiUrl}/api/auth/sign-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.token}` },
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
