import { db } from "@/db";
import { users, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

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

const optionalString = z.string().max(500).nullable().optional();
const optionalStringArrayOrString = z
  .union([z.array(z.string().max(200)), z.string().max(1000)])
  .nullable()
  .optional();

const optionalMembershipsArray = z
  .union([
    z.array(z.object({ organization: z.string(), status: z.string() })),
    z.array(z.string().max(200)), // legacy fallback
    z.string().max(1000)
  ])
  .nullable()
  .optional();

const optionalNumber = (min?: number, max?: number) => {
  let numSchema = z.number();
  if (min !== undefined) numSchema = numSchema.min(min);
  if (max !== undefined) numSchema = numSchema.max(max);
  return z
    .union([
      numSchema,
      z.literal("N/A"),
      z.string().transform((val) => {
        if (val.trim() === "") return null;
        const parsed = Number(val);
        // If it's not a valid number (e.g. "Don't have one yet"), preserve the string so the UI knows the user explicitly chose N/A
        if (isNaN(parsed)) {
          return val;
        }
        return parsed;
      }),
    ])
    .nullable()
    .optional();
};

export const profileSchema = z
  .object({
    // === Demographics ===
    age: optionalNumber(0, 120),
    gender: optionalString,
    race: optionalStringArrayOrString,
    ethnicity: optionalStringArrayOrString,
    lgbtq: optionalString,

    // === Location ===
    countryOfResidence: optionalString,
    usState: optionalString,
    usCountyCity: optionalString,
    canadianProvince: optionalString,

    // === Citizenship ===
    citizenshipStatus: optionalString,
    visaType: optionalString,

    // === Education ===
    educationType: optionalStringArrayOrString,
    degreePursuing: optionalStringArrayOrString,
    degreesHeld: optionalStringArrayOrString,
    yearOfStudy: optionalStringArrayOrString,
    enrollmentStatus: optionalString,
    institutionName: optionalString,
    institutionType: optionalStringArrayOrString,
    gpa: optionalNumber(0, 5.0),
    creditHoursCompleted: optionalNumber(0, 500),

    // === Academics ===
    fieldOfStudy: optionalStringArrayOrString,
    minor: optionalString,
    satScore: optionalNumber(400, 1600),
    actScore: optionalNumber(1, 36),
    otherTestScores: z
      .union([
        z.string().max(2000),
        z.record(z.string(), z.unknown()),
        z.array(z.unknown()),
      ])
      .nullable()
      .optional(),

    // === Financial & Background ===
    financialNeed: optionalString,
    military: optionalStringArrayOrString,
    firstGeneration: z.boolean().nullable().optional(),
    fosterCare: z.boolean().nullable().optional(),
    disability: optionalString,
    medicalConditionDetail: optionalStringArrayOrString,

    // === Activities & Goals ===
    communityService: z.boolean().nullable().optional(),
    memberships: optionalMembershipsArray,
    careerGoals: optionalStringArrayOrString,

    // === Metadata ===
    questionnaireCompleted: z.boolean().nullable().optional(),
  });

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

  // Parse JSON fields back to arrays/objects
  const parsed = parseProfile(profile);
  return Response.json({ profile: parsed, completed: profile.questionnaireCompleted });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUser(userId);

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parseResult = profileSchema.safeParse(rawBody);
  if (!parseResult.success) {
    console.error("Zod Validation Error:", JSON.stringify(parseResult.error.format(), null, 2));
    return Response.json(
      { error: "Invalid request payload", details: parseResult.error.format() },
      { status: 400 }
    );
  }

  const validatedData = parseResult.data;

  // Serialize array/object fields to JSON strings for storage
  const serialized = serializeProfile(validatedData as Record<string, unknown>);

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
      ...serialized,
      userId, // Placed after spread for defense-in-depth
    });
  }

  return Response.json({ success: true });
}

// Fields that are stored as JSON arrays or objects
const JSON_FIELDS = [
  "race",
  "ethnicity",
  "educationType",
  "degreePursuing",
  "degreesHeld",
  "yearOfStudy",
  "institutionType",
  "fieldOfStudy",
  "military",
  "medicalConditionDetail",
  "memberships",
  "careerGoals",
  "otherTestScores",
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
    if (Array.isArray(result[field]) || (typeof result[field] === "object" && result[field] !== null)) {
      result[field] = JSON.stringify(result[field]);
    }
  }
  return result;
}

