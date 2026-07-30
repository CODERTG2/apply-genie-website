import { db } from "@/db";
import { userRequirementResponses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import scholarshipsData from "../../../../../current_scholarships.json";
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
  for (const s of scholarshipsData as Scholarship[]) {
    if (!s.SpecificRequirements || s.SpecificRequirements.length === 0) continue;
    for (const req of s.SpecificRequirements) {
      if (!reqToTitle[req.description]) {
        reqToTitle[req.description] = s.Title;
      }
    }
  }

  const responsesWithTitles = responses.map((r) => ({
    ...r,
    scholarshipTitle: reqToTitle[r.requirement] || "Unknown Scholarship",
  }));

  return Response.json({ responses: responsesWithTitles });
}
