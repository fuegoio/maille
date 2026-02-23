import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { env } from "./env";

const sqlite = new Database(`${env.DATA_DIR}/sqlite.db`);

export const db = drizzle(sqlite);
