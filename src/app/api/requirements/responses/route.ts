import { db } from "@/db";
import { userRequirementResponses, scholarships as scholarshipsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { Scholarship } from "@/lib/scholarshipMatching";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const responses = await db
    .select()
    .from(userRequirementResponses)
    .where(eq(userRequirementResponses.userId, userId))
    .orderBy(desc(userRequirementResponses.answeredAt));

  // Map requirement descriptions to scholarship titles
  const reqToTitle: Record<string, string> = {};
  
  const dbScholarships = await db.select().from(scholarshipsTable);
  for (const s of dbScholarships as unknown as Scholarship[]) {
    if (!s.specificRequirements || s.specificRequirements.length === 0) continue;
    for (const req of s.specificRequirements) {
      if (!reqToTitle[req.description]) {
        reqToTitle[req.description] = s.title;
      }
    }
  }

  const responsesWithTitles = responses.map((r) => ({
    ...r,
    scholarshipTitle: reqToTitle[r.requirement] || "Unknown Scholarship",
  }));

  return Response.json({ responses: responsesWithTitles });
}
