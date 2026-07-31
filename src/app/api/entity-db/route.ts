import { NextResponse } from 'next/server';
import { db } from '@/db';
import { entityDb } from '@/db/schema';

// Revalidate cache every 24 hours to reduce Turso quota usage
export const revalidate = 86400;

export async function GET() {
  try {
    const results = await db.select().from(entityDb);
    
    // Convert array of {category, entities} back into an object mapping category -> entities
    const entityDbObj: Record<string, string[]> = {};
    for (const row of results) {
      entityDbObj[row.category] = row.entities as string[];
    }

    return NextResponse.json(entityDbObj);
  } catch (error) {
    console.error('Failed to fetch entity DB from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch entity DB' }, { status: 500 });
  }
}
