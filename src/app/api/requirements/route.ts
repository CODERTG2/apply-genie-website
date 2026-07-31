import { db } from "@/db";
import { userProfiles, userRequirementResponses, scholarships as scholarshipsTable } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { matchScholarship, Scholarship, SpecificRequirement } from "@/lib/scholarshipMatching";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).get();
  if (!profile) return Response.json({ requirements: [] });

  const userResponsesList = await db.select().from(userRequirementResponses).where(eq(userRequirementResponses.userId, userId));
  const userResponsesMap: Record<string, boolean> = {};
  for (const resp of userResponsesList) {
    userResponsesMap[resp.requirement] = resp.isMet;
  }

  const profileRecord = profile as unknown as Record<string, unknown>;
  const reqsWithScore: Array<{ req: SpecificRequirement, score: number, scholarshipTitle: string }> = [];

  const dbScholarships = await db.select().from(scholarshipsTable);

  for (const s of dbScholarships as unknown as Scholarship[]) {
    if (!s.attributes || Object.keys(s.attributes).length === 0) continue;
    if (!s.specificRequirements || s.specificRequirements.length === 0) continue;

    const { matches, matchedFields, totalFields } = matchScholarship(
      profileRecord,
      s.attributes,
      s.specificRequirements,
      userResponsesMap
    );

    if (matches && totalFields > 0) {
      const matchScore = Math.round((matchedFields / totalFields) * 100);
      
      for (const req of s.specificRequirements) {
        if (userResponsesMap[req.description] === undefined) {
          reqsWithScore.push({ req, score: matchScore, scholarshipTitle: s.title });
        }
      }
    }
  }

  // Sort by score descending
  reqsWithScore.sort((a, b) => b.score - a.score);

  // Deduplicate requirements (in case multiple scholarships share the same requirement string)
  const uniqueReqs = [];
  const seen = new Set<string>();
  for (const item of reqsWithScore) {
    if (!seen.has(item.req.description)) {
      seen.add(item.req.description);
      uniqueReqs.push({
        ...item.req,
        associatedScholarshipScore: item.score,
        scholarshipTitle: item.scholarshipTitle
      });
    }
  }

  return Response.json({ requirements: uniqueReqs });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { requirement, isMet } = await req.json();
  if (!requirement || typeof isMet !== "boolean") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(userRequirementResponses)
    .where(
      and(
        eq(userRequirementResponses.userId, userId),
        eq(userRequirementResponses.requirement, requirement)
      )
    )
    .get();

  if (existing) {
    await db
      .update(userRequirementResponses)
      .set({ isMet, answeredAt: sql`(datetime('now'))` })
      .where(eq(userRequirementResponses.id, existing.id));
  } else {
    await db
      .insert(userRequirementResponses)
      .values({
        userId,
        requirement,
        isMet,
      });
  }

  return Response.json({ success: true });
}
