import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function run() {
  const localClient = createClient({ url: 'file:apply-genie.db' });
  const db = drizzle(localClient, { schema });
  try {
    const profiles = await db.select().from(schema.userProfiles).all();
    console.log(profiles);
  } catch (e) {
    console.error(e);
  }
}
run();
