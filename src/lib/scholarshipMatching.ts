// Type for scholarship attributes
export type ScholarshipAttributes = Record<string, unknown>;

export type SpecificRequirement = {
  type: string;
  description: string;
  category_hint?: string;
  source_text?: string;
  question?: string;
  yes_is_eligible?: boolean;
};

export type Scholarship = {
  id: number;
  title: string;
  organization?: string | null;
  funds?: string | null;
  deadline?: string | null;
  deadlineDate?: string | null;
  link?: string | null;
  purpose?: string | null;
  qualifications?: string | null;
  attributes?: ScholarshipAttributes | null;
  specificRequirements?: SpecificRequirement[] | null;
  [key: string]: unknown;
};

// Map profile column names to attribute_schema keys
export const PROFILE_TO_ATTR: Record<string, string> = {
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
  degreesHeld: "degrees_held",
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
export const JSON_FIELDS = new Set([
  "race", "ethnicity", "educationType", "degreePursuing", "degreesHeld",
  "yearOfStudy", "institutionType", "fieldOfStudy",
  "military", "medicalConditionDetail", "memberships", "careerGoals",
]);

export function parseJsonField(value: unknown): string[] {
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

export function matchScholarship(
  profile: Record<string, unknown>,
  attrs: ScholarshipAttributes,
  specificRequirements: SpecificRequirement[] = [],
  userRequirementResponses: Record<string, boolean> = {}
): { matches: boolean; matchedFields: number; totalFields: number; unansweredReqsCount: number } {
  let matchedFields = 0;
  let totalFields = 0;
  let unansweredReqsCount = 0;

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
      if (ageReq.min !== undefined && userAge < ageReq.min) return { matches: false, matchedFields, totalFields, unansweredReqsCount };
      if (ageReq.max !== undefined && userAge > ageReq.max) return { matches: false, matchedFields, totalFields, unansweredReqsCount };
      matchedFields++;
      continue;
    }

    // GPA: numeric >= comparison
    if (attrKey === "gpa" && typeof requirement === "number") {
      const userGpa = typeof userValue === "number" ? userValue : null;
      if (userGpa === null) continue;
      if (userGpa < requirement) return { matches: false, matchedFields, totalFields, unansweredReqsCount };
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
      if (userNum < requirement) return { matches: false, matchedFields, totalFields, unansweredReqsCount };
      matchedFields++;
      continue;
    }

    // Boolean fields
    if (
      (attrKey === "first_generation" || attrKey === "foster_care" || attrKey === "community_service") &&
      typeof requirement === "boolean"
    ) {
      if (requirement === true && userValue !== true) return { matches: false, matchedFields, totalFields, unansweredReqsCount };
      matchedFields++;
      continue;
    }

    // Array requirements: user must have at least one matching value
    if (Array.isArray(requirement)) {
      const userValues = JSON_FIELDS.has(profileKey) ? parseJsonField(userValue) : [userValue];
      const hasOverlap = requirement.some((r: any) =>
        userValues.some((uv: any) => {
          const rStr = typeof r === "object" && r !== null && r.organization ? r.organization : (typeof r === "string" ? r : null);
          const uvStr = typeof uv === "object" && uv !== null && uv.organization ? uv.organization : (typeof uv === "string" ? uv : null);
          if (rStr && uvStr) {
            return rStr.toLowerCase() === uvStr.toLowerCase();
          }
          return false;
        })
      );
      if (!hasOverlap) return { matches: false, matchedFields, totalFields, unansweredReqsCount };
      matchedFields++;
      continue;
    }

    // Single string match
    if (typeof requirement === "string") {
      const userStr = typeof userValue === "string" ? userValue : null;
      if (userStr === null) continue;
      if (userStr.toLowerCase() !== requirement.toLowerCase()) return { matches: false, matchedFields, totalFields, unansweredReqsCount };
      matchedFields++;
      continue;
    }
  }

  for (const req of specificRequirements) {
    totalFields++;
    const reqKey = req.question || req.description;
    const userResponse = userRequirementResponses[reqKey];

    if (userResponse === true) {
      matchedFields++;
    } else if (userResponse === false) {
      // User swiped fail. 
      // Do nothing to matchedFields so it lowers score. 
      // Alternatively could return matches: false but user wants to "update match percentage".
    } else {
      // userResponse is undefined (Unanswered)
      unansweredReqsCount++;
    }
  }

  return { matches: true, matchedFields, totalFields, unansweredReqsCount };
}
