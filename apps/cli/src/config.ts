import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CONFIG_DIR = join(homedir(), ".maille");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface Config {
  apiUrl: string;
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    currency: string;
  } | null;
}

const DEFAULT_CONFIG: Config = {
  apiUrl: "http://localhost:3000",
  token: null,
  user: null,
};

export function readConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function writeConfig(config: Partial<Config>): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const current = readConfig();
  const updated = { ...current, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), { mode: 0o600 });
}

export function clearAuth(): void {
  writeConfig({ token: null, user: null });
}

export function requireAuth(): { token: string; apiUrl: string } {
  const config = readConfig();
  if (!config.token) {
    console.error("Not authenticated. Run: maille login");
    process.exit(1);
  }
  return { token: config.token, apiUrl: config.apiUrl };
}
