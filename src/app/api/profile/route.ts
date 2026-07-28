import { db } from "@/db";
import { users, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// Helper to ensure user exists in DB (for dev without webhooks)
async function ensureUser(clerkId: string) {
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).get();
  if (!existing) {
    await db.insert(users).values({
      clerkId,
      email: "pending@sync.dev", // Will be updated by webhook
    }).onConflictDoNothing();
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUser(userId);

  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .get();

  if (!profile) {
    return Response.json({ profile: null, completed: false });
  }

  // Parse JSON fields back to arrays
  const parsed = parseProfile(profile);
  return Response.json({ profile: parsed, completed: profile.questionnaireCompleted });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUser(userId);

  const body = await req.json();

  // Serialize array fields to JSON strings for storage
  const serialized = serializeProfile(body);

  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .get();

  if (existing) {
    await db
      .update(userProfiles)
      .set({ ...serialized, lastUpdated: new Date().toISOString() })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      ...serialized,
    });
  }

  return Response.json({ success: true });
}

// Fields that are stored as JSON arrays
const JSON_FIELDS = [
  "race",
  "ethnicity",
  "educationType",
  "degreePursuing",
  "yearOfStudy",
  "institutionType",
  "fieldOfStudy",
  "military",
  "medicalConditionDetail",
  "memberships",
  "careerGoals",
];

function parseProfile(profile: Record<string, unknown>) {
  const result = { ...profile };
  for (const field of JSON_FIELDS) {
    if (typeof result[field] === "string") {
      try {
        result[field] = JSON.parse(result[field] as string);
      } catch {
        // Leave as-is if not valid JSON
      }
    }
  }
  return result;
}

function serializeProfile(data: Record<string, unknown>) {
  const result = { ...data };
  for (const field of JSON_FIELDS) {
    if (Array.isArray(result[field])) {
      result[field] = JSON.stringify(result[field]);
    }
  }
  return result;
}
