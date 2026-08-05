import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.NODE_ENV === 'production' 
  ? process.env.TURSO_PROD_DATABASE_URL || process.env.TURSO_DATABASE_URL 
  : process.env.TURSO_DEV_DATABASE_URL || process.env.TURSO_DATABASE_URL;

const authToken = process.env.NODE_ENV === 'production' 
  ? process.env.TURSO_PROD_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN 
  : process.env.TURSO_DEV_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url: url!,
  authToken: authToken!,
});

// Singleton pattern to avoid multiple connections in dev (hot reload)
const globalForDb = globalThis as unknown as {
  _db: ReturnType<typeof drizzle> | undefined;
};

if (!globalForDb._db) {
  globalForDb._db = drizzle(client, { schema });
}

export const db = globalForDb._db;
