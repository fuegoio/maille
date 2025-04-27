import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const DATA_DIR = process.env.DATA_DIR || ".";
const sqlite = new Database(`${DATA_DIR}/sqlite.db`);
export const db = drizzle(sqlite);
