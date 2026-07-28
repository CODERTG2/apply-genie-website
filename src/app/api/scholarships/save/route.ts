import { db } from "@/db";
import { savedScholarships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saved = await db
    .select()
    .from(savedScholarships)
    .where(eq(savedScholarships.userId, userId));

  return Response.json({ saved });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json();
  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  // Check if already saved
  const existing = await db
    .select()
    .from(savedScholarships)
    .where(
      and(
        eq(savedScholarships.userId, userId),
        eq(savedScholarships.scholarshipTitle, title)
      )
    )
    .get();

  if (existing) {
    return Response.json({ message: "Already saved" });
  }

  await db.insert(savedScholarships).values({
    userId,
    scholarshipTitle: title,
  });

  return Response.json({ success: true });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json();
  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  await db
    .delete(savedScholarships)
    .where(
      and(
        eq(savedScholarships.userId, userId),
        eq(savedScholarships.scholarshipTitle, title)
      )
    );

  return Response.json({ success: true });
}
