import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────
// Synced from Clerk via webhook on user.created / user.deleted
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

// ─── User Profiles ───────────────────────────────────────
// One-to-one with users. Stores all questionnaire answers.
// Multi-select fields are stored as JSON strings (e.g., '["Asian","White"]')
export const userProfiles = sqliteTable('user_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique().references(() => users.clerkId, { onDelete: 'cascade' }),

  // === Demographics (order 1–5) ===
  age: integer('age'),
  gender: text('gender'),               // single_select
  race: text('race'),                    // multi_select → JSON string
  ethnicity: text('ethnicity'),          // multi_select → JSON string
  lgbtq: text('lgbtq'),                 // single_select

  // === Location (order 6–8) ===
  countryOfResidence: text('country_of_residence'),
  usState: text('us_state'),
  usCountyCity: text('us_county_city'),
  canadianProvince: text('canadian_province'),

  // === Citizenship (order 9–10) ===
  citizenshipStatus: text('citizenship_status'),
  visaType: text('visa_type'),

  // === Education (order 11–18) ===
  educationType: text('education_type'),       // multi_select → JSON
  degreePursuing: text('degree_pursuing'),      // multi_select → JSON
  yearOfStudy: text('year_of_study'),           // multi_select → JSON
  enrollmentStatus: text('enrollment_status'),
  institutionName: text('institution_name'),
  institutionType: text('institution_type'),    // multi_select → JSON
  gpa: real('gpa'),
  creditHoursCompleted: integer('credit_hours_completed'),

  // === Academics (order 19–23) ===
  fieldOfStudy: text('field_of_study'),        // multi → JSON
  minor: text('minor'),
  satScore: integer('sat_score'),
  actScore: integer('act_score'),
  otherTestScores: text('other_test_scores'),  // JSON map

  // === Financial & Background (order 24–28) ===
  financialNeed: text('financial_need'),
  military: text('military'),                  // multi_select → JSON
  firstGeneration: integer('first_generation', { mode: 'boolean' }),
  fosterCare: integer('foster_care', { mode: 'boolean' }),
  disability: text('disability'),
  medicalConditionDetail: text('medical_condition_detail'), // multi → JSON

  // === Activities & Goals (order 30–32) ===
  communityService: integer('community_service', { mode: 'boolean' }),
  memberships: text('memberships'),            // multi → JSON
  careerGoals: text('career_goals'),           // multi → JSON

  // === Metadata ===
  questionnaireCompleted: integer('questionnaire_completed', { mode: 'boolean' }).default(false),
  lastUpdated: text('last_updated').default(sql`(datetime('now'))`).notNull(),
});

// ─── Saved Scholarships ──────────────────────────────────
// Junction table for bookmarked/saved scholarships
export const savedScholarships = sqliteTable('saved_scholarships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.clerkId, { onDelete: 'cascade' }),
  scholarshipTitle: text('scholarship_title').notNull(),
  savedAt: text('saved_at').default(sql`(datetime('now'))`).notNull(),
});

// ─── User Requirement Responses ──────────────────────────
// Tracks user pass/fail responses to SpecificRequirements
export const userRequirementResponses = sqliteTable('user_requirement_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.clerkId, { onDelete: 'cascade' }),
  requirement: text('requirement').notNull(),
  isMet: integer('is_met', { mode: 'boolean' }).notNull(),
  answeredAt: text('answered_at').default(sql`(datetime('now'))`).notNull(),
});
