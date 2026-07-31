import { config } from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';

// Helper to escape CSV fields
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // If string contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportData() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoAuthToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  }

  const client = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });
  
  // Drizzle automatically decrypts everything!
  const db = drizzle(client, { schema });

  console.log('🔄 Fetching decrypted data from Turso...');

  // 1. Export Users
  const users = await db.select().from(schema.users).all();
  if (users.length > 0) {
    const userHeaders = Object.keys(users[0]).join(',');
    const userRows = users.map(u => Object.values(u).map(escapeCSV).join(',')).join('\n');
    fs.writeFileSync('users_export.csv', `${userHeaders}\n${userRows}`);
    console.log(`✅ Exported ${users.length} users to users_export.csv`);
  }

  // 2. Export Profiles
  const profiles = await db.select().from(schema.userProfiles).all();
  if (profiles.length > 0) {
    const profileHeaders = Object.keys(profiles[0]).join(',');
    const profileRows = profiles.map(p => Object.values(p).map(escapeCSV).join(',')).join('\n');
    fs.writeFileSync('profiles_export.csv', `${profileHeaders}\n${profileRows}`);
    console.log(`✅ Exported ${profiles.length} profiles to profiles_export.csv`);
  }

  // 3. Export Scholarships
  const scholarships = await db.select().from(schema.savedScholarships).all();
  if (scholarships.length > 0) {
    const sHeaders = Object.keys(scholarships[0]).join(',');
    const sRows = scholarships.map(s => Object.values(s).map(escapeCSV).join(',')).join('\n');
    fs.writeFileSync('scholarships_export.csv', `${sHeaders}\n${sRows}`);
    console.log(`✅ Exported ${scholarships.length} scholarships to scholarships_export.csv`);
  }

  console.log('\n🎉 All decrypted data exported to CSV files in the project root!');
}

exportData().catch(console.error);
