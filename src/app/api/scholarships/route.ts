import { db } from "@/db";
import { userProfiles, userRequirementResponses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import scholarshipsData from "../../../../current_scholarships.json";
import { matchScholarship, Scholarship } from "@/lib/scholarshipMatching";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .get();

  if (!profile) {
    return Response.json({
      scholarships: [],
      message: "Complete your profile to see matches",
      hasUnansweredReqs: false
    });
  }

  // Fetch user's requirement responses
  const userResponsesList = await db
    .select()
    .from(userRequirementResponses)
    .where(eq(userRequirementResponses.userId, userId));
    
  const userResponsesMap: Record<string, boolean> = {};
  for (const resp of userResponsesList) {
    userResponsesMap[resp.requirement] = resp.isMet;
  }

  let totalUnansweredReqs = 0;
  const profileRecord = profile as unknown as Record<string, unknown>;
  
  const results: Array<{
    title: string;
    organization: string;
    funds: string;
    deadline: string;
    link: string;
    purpose: string;
    matchedFields: number;
    totalFields: number;
    matchScore: number;
    unansweredReqsCount: number;
  }> = [];

  for (const s of scholarshipsData as Scholarship[]) {
    if (!s.Attributes || Object.keys(s.Attributes).length === 0) continue;

    const { matches, matchedFields, totalFields, unansweredReqsCount } = matchScholarship(
      profileRecord,
      s.Attributes,
      s.SpecificRequirements || [],
      userResponsesMap
    );
    
    totalUnansweredReqs += unansweredReqsCount;

    if (matches && totalFields > 0) {
      results.push({
        title: s.Title,
        organization: typeof s.Organization === "string" ? s.Organization.split("\n")[0] : "",
        funds: typeof s.Funds === "string" ? s.Funds : "Varies",
        deadline: typeof s.Deadline_Date === "string" ? s.Deadline_Date : "",
        link: typeof s.Link === "string" ? s.Link : "",
        purpose: typeof s.Purpose === "string" ? s.Purpose.slice(0, 200) : "",
        matchedFields,
        totalFields,
        matchScore: Math.round((matchedFields / totalFields) * 100),
        unansweredReqsCount,
      });
    }
  }

  // Sort by match score descending, then by fund amount
  results.sort((a, b) => b.matchScore - a.matchScore);

  return Response.json({ 
    scholarships: results, 
    total: results.length,
    hasUnansweredReqs: totalUnansweredReqs > 0
  });
}
