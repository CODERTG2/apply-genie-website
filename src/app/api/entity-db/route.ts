import { NextResponse } from 'next/server';
import { db } from '@/db';
import { entityDb } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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

export async function POST(request: Request) {
  try {
    const { category, entity } = await request.json();
    if (!category || !entity) {
      return NextResponse.json({ error: 'Missing category or entity' }, { status: 400 });
    }

    const existingCategory = await db.select().from(entityDb).where(eq(entityDb.category, category)).get();
    
    if (existingCategory) {
      const entities = existingCategory.entities as string[];
      if (!entities.includes(entity)) {
        entities.push(entity);
        await db.update(entityDb).set({ entities }).where(eq(entityDb.category, category));
      }
    } else {
      await db.insert(entityDb).values({ category, entities: [entity] });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update entity DB:', error);
    return NextResponse.json({ error: 'Failed to update entity DB' }, { status: 500 });
  }
}
