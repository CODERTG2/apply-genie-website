import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.LOCAL_DB ? 'file:apply-genie.db' : (process.env.NODE_ENV === 'production' ? process.env.TURSO_PROD_DATABASE_URL : process.env.TURSO_DEV_DATABASE_URL) || process.env.TURSO_DATABASE_URL || 'file:apply-genie.db',
    authToken: process.env.LOCAL_DB ? undefined : (process.env.NODE_ENV === 'production' ? process.env.TURSO_PROD_AUTH_TOKEN : process.env.TURSO_DEV_AUTH_TOKEN) || process.env.TURSO_AUTH_TOKEN,
  },
});
