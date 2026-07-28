import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Store the database file at the project root
const DB_PATH = path.join(process.cwd(), 'apply-genie.db');

// Singleton pattern to avoid multiple connections in dev (hot reload)
const globalForDb = globalThis as unknown as {
  _db: ReturnType<typeof drizzle> | undefined;
  _sqlite: Database.Database | undefined;
};

if (!globalForDb._sqlite) {
  globalForDb._sqlite = new Database(DB_PATH, { timeout: 10000 });
  // Enable WAL mode for better concurrent read performance
  globalForDb._sqlite.pragma('journal_mode = WAL');
}

if (!globalForDb._db) {
  globalForDb._db = drizzle(globalForDb._sqlite, { schema });
}

export const db = globalForDb._db;
