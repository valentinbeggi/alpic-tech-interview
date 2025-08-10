import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";

const dbPath = process.env.SQLITE_PATH ?? ".data/app.db";
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });
export * as schema from "../db/schema";
