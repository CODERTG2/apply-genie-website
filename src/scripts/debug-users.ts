import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

async function debugUsers() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoAuthToken) {
    throw new Error('Missing Turso credentials');
  }

  const client = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });
  
  // Use schema with encryption types
  const db = drizzle(client, { schema });

  console.log('--- 🛡️ SECURE DEBUGGING ---');
  console.log('Fetching users from Turso (Automatically Decrypting)...\n');

  try {
    const allUsers = await db.select().from(schema.users).all();
    
    if (allUsers.length === 0) {
      console.log('No users found in database.');
      return;
    }

    for (const user of allUsers) {
      console.log(`User: ${user.firstName} ${user.lastName} <${user.email}> (Clerk: ${user.clerkId})`);
      
      const profiles = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, user.clerkId)).all();
      
      if (profiles.length > 0) {
        const profile = profiles[0];
        console.log(`  Profile Details:`);
        console.log(`    - Age: ${profile.age}`);
        console.log(`    - Gender: ${profile.gender}`);
        console.log(`    - Race: ${profile.race}`);
        console.log(`    - GPA: ${profile.gpa}`);
        console.log(`    - First Gen: ${profile.firstGeneration}`);
      } else {
        console.log(`  (No profile found)`);
      }
      console.log('----------------------------------------------------');
    }

    // Let's also demonstrate what the RAW ciphertext looks like in the DB!
    console.log('\n--- 🔒 RAW CIPHERTEXT PREVIEW ---');
    console.log('This is what is actually stored in Turso (unreadable by attackers):\n');
    
    // Query without schema to bypass decryption
    const rawData = await client.execute('SELECT email, first_name, last_name FROM users LIMIT 1');
    if (rawData.rows.length > 0) {
      console.log(rawData.rows[0]);
    }

  } catch (error) {
    console.error('Debug script failed:', error);
  }
}

debugUsers();
