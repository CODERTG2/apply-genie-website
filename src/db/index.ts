import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Singleton pattern to avoid multiple connections in dev (hot reload)
const globalForDb = globalThis as unknown as {
  _db: ReturnType<typeof drizzle> | undefined;
};

if (!globalForDb._db) {
  globalForDb._db = drizzle(client, { schema });
}

export const db = globalForDb._db;
