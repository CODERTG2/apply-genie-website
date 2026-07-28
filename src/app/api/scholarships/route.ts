import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import scholarshipsData from "../../../../current_scholarships.json";

// Type for scholarship attributes
type ScholarshipAttributes = Record<string, unknown>;

type Scholarship = {
  Title: string;
  Organization?: string;
  Funds?: string;
  Deadline?: string;
  Link?: string;
  Purpose?: string;
  Qualifications?: string;
  Attributes?: ScholarshipAttributes;
  SpecificRequirements?: Array<{ type: string; description: string }>;
  [key: string]: unknown;
};

// Map profile column names to attribute_schema keys
const PROFILE_TO_ATTR: Record<string, string> = {
  age: "age",
  gender: "gender",
  race: "race",
  ethnicity: "ethnicity",
  lgbtq: "lgbtq",
  countryOfResidence: "country_of_residence",
  usState: "us_state",
  canadianProvince: "canadian_province",
  citizenshipStatus: "citizenship_status",
  visaType: "visa_type",
  educationType: "education_type",
  degreePursuing: "degree_pursuing",
  yearOfStudy: "year_of_study",
  enrollmentStatus: "enrollment_status",
  institutionName: "institution_name",
  institutionType: "institution_type",
  gpa: "gpa",
  creditHoursCompleted: "credit_hours_completed",
  fieldOfStudy: "field_of_study",
  minor: "minor",
  satScore: "sat_score",
  actScore: "act_score",
  financialNeed: "financial_need",
  military: "military",
  firstGeneration: "first_generation",
  fosterCare: "foster_care",
  disability: "disability",
  medicalConditionDetail: "medical_condition_detail",
  communityService: "community_service",
  memberships: "memberships",
  careerGoals: "career_goals",
};

// JSON-encoded multi-select fields
const JSON_FIELDS = new Set([
  "race", "ethnicity", "educationType", "degreePursuing",
  "yearOfStudy", "institutionType", "fieldOfStudy",
  "military", "medicalConditionDetail", "memberships", "careerGoals",
]);

function parseJsonField(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return [];
}

function matchScholarship(
  profile: Record<string, unknown>,
  attrs: ScholarshipAttributes
): { matches: boolean; matchedFields: number; totalFields: number } {
  let matchedFields = 0;
  let totalFields = 0;

  for (const [profileKey, attrKey] of Object.entries(PROFILE_TO_ATTR)) {
    const requirement = attrs[attrKey];
    if (requirement === undefined || requirement === null) continue;

    totalFields++;
    const userValue = profile[profileKey];

    // Age: { min?: number, max?: number }
    if (attrKey === "age" && typeof requirement === "object" && requirement !== null) {
      const ageReq = requirement as { min?: number; max?: number };
      const userAge = typeof userValue === "number" ? userValue : null;
      if (userAge === null) continue; // Skip if user hasn't answered
      if (ageReq.min !== undefined && userAge < ageReq.min) return { matches: false, matchedFields, totalFields };
      if (ageReq.max !== undefined && userAge > ageReq.max) return { matches: false, matchedFields, totalFields };
      matchedFields++;
      continue;
    }

    // GPA: numeric >= comparison
    if (attrKey === "gpa" && typeof requirement === "number") {
      const userGpa = typeof userValue === "number" ? userValue : null;
      if (userGpa === null) continue;
      if (userGpa < requirement) return { matches: false, matchedFields, totalFields };
      matchedFields++;
      continue;
    }

    // Numeric >= fields (sat_score, act_score, credit_hours_completed)
    if (
      (attrKey === "sat_score" || attrKey === "act_score" || attrKey === "credit_hours_completed") &&
      typeof requirement === "number"
    ) {
      const userNum = typeof userValue === "number" ? userValue : null;
      if (userNum === null) continue;
      if (userNum < requirement) return { matches: false, matchedFields, totalFields };
      matchedFields++;
      continue;
    }

    // Boolean fields
    if (
      (attrKey === "first_generation" || attrKey === "foster_care" || attrKey === "community_service") &&
      typeof requirement === "boolean"
    ) {
      if (requirement === true && userValue !== true) return { matches: false, matchedFields, totalFields };
      matchedFields++;
      continue;
    }

    // Array requirements: user must have at least one matching value
    if (Array.isArray(requirement)) {
      const userValues = JSON_FIELDS.has(profileKey) ? parseJsonField(userValue) : [userValue];
      const hasOverlap = requirement.some((r: string) =>
        userValues.some((uv) => typeof uv === "string" && uv.toLowerCase() === r.toLowerCase())
      );
      if (!hasOverlap) return { matches: false, matchedFields, totalFields };
      matchedFields++;
      continue;
    }

    // Single string match
    if (typeof requirement === "string") {
      const userStr = typeof userValue === "string" ? userValue : null;
      if (userStr === null) continue;
      if (userStr.toLowerCase() !== requirement.toLowerCase()) return { matches: false, matchedFields, totalFields };
      matchedFields++;
      continue;
    }
  }

  return { matches: true, matchedFields, totalFields };
}

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
    });
  }

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
  }> = [];

  for (const s of scholarshipsData as Scholarship[]) {
    if (!s.Attributes || Object.keys(s.Attributes).length === 0) continue;

    const { matches, matchedFields, totalFields } = matchScholarship(
      profileRecord,
      s.Attributes
    );

    if (matches && totalFields > 0) {
      results.push({
        title: s.Title,
        organization: typeof s.Organization === "string" ? s.Organization.split("\n")[0] : "",
        funds: typeof s.Funds === "string" ? s.Funds : "Varies",
        deadline: typeof s.Deadline === "string" ? s.Deadline : "See website",
        link: typeof s.Link === "string" ? s.Link : "",
        purpose: typeof s.Purpose === "string" ? s.Purpose.slice(0, 200) : "",
        matchedFields,
        totalFields,
        matchScore: Math.round((matchedFields / totalFields) * 100),
      });
    }
  }

  // Sort by match score descending, then by fund amount
  results.sort((a, b) => b.matchScore - a.matchScore);

  return Response.json({ scholarships: results, total: results.length });
}
