import { NextResponse } from 'next/server';
import { db } from '@/db';
import { attributeSchema } from '@/db/schema';

// Revalidate cache every 24 hours to reduce Turso quota usage
export const revalidate = 86400;

export async function GET() {
  try {
    const results = await db.select().from(attributeSchema);
    
    // Convert array of {key, config} back into an object mapping key -> config
    const schemaObj: Record<string, any> = {};
    for (const row of results) {
      schemaObj[row.key] = row.config;
    }

    return NextResponse.json(schemaObj);
  } catch (error) {
    console.error('Failed to fetch attribute schema from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch schema' }, { status: 500 });
  }
}
