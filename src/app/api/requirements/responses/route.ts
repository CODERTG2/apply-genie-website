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

  const reqToTitle: Record<string, string> = {};
  const reqToYesIsEligible: Record<string, boolean> = {};
  
  const dbScholarships = await db.select().from(scholarshipsTable);
  for (const s of dbScholarships as unknown as Scholarship[]) {
    if (!s.specificRequirements || s.specificRequirements.length === 0) continue;
    for (const req of s.specificRequirements) {
      const reqKey = req.question || req.description;
      if (!reqToTitle[reqKey]) {
        reqToTitle[reqKey] = s.title;
        reqToYesIsEligible[reqKey] = req.yes_is_eligible ?? true;
      }
    }
  }

  const responsesWithTitles = responses.map((r) => {
    const yesIsEligible = reqToYesIsEligible[r.requirement] ?? true;
    const isYes = r.isMet === yesIsEligible;
    return {
      ...r,
      scholarshipTitle: reqToTitle[r.requirement] || "Unknown Scholarship",
      isYes,
      yesIsEligible
    };
  });

  return Response.json({ responses: responsesWithTitles });
}
