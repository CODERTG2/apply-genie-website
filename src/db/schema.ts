import { sqliteTable, text, integer, real, customType } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/encryption';

// --- Encrypted Custom Types ---
const encryptedText = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'text';
  },
  toDriver(val: string): string {
    return val ? encrypt(val) : val;
  },
  fromDriver(val: string): string {
    return val ? decrypt(val) : val;
  },
});

const encryptedInt = customType<{ data: number | string; driverData: string }>({
  dataType() {
    return 'text';
  },
  toDriver(val: number | string): string {
    return val !== undefined && val !== null ? encrypt(String(val)) : (val as any);
  },
  fromDriver(val: string): number | string {
    if (val === undefined || val === null) return val as any;
    const dec = decrypt(val);
    if (dec === null || dec === undefined) return dec as any;
    const num = parseInt(dec, 10);
    return isNaN(num) || String(num) !== dec.trim() ? dec : num;
  },
});

const encryptedReal = customType<{ data: number | string; driverData: string }>({
  dataType() {
    return 'text';
  },
  toDriver(val: number | string): string {
    return val !== undefined && val !== null ? encrypt(String(val)) : (val as any);
  },
  fromDriver(val: string): number | string {
    if (val === undefined || val === null) return val as any;
    const dec = decrypt(val);
    if (dec === null || dec === undefined) return dec as any;
    const num = parseFloat(dec);
    return isNaN(num) ? dec : num;
  },
});

const encryptedBoolean = customType<{ data: boolean; driverData: string }>({
  dataType() {
    return 'text';
  },
  toDriver(val: boolean): string {
    if (val === undefined || val === null) return val as any;
    return encrypt(val ? '1' : '0');
  },
  fromDriver(val: string): boolean {
    if (val === undefined || val === null) return val as any;
    const dec = decrypt(val);
    // Support SQLite standard boolean representations
    return dec === '1' || dec === 'true' || dec === 'yes';
  },
});

// ─── Users ───────────────────────────────────────────────
// Synced from Clerk via webhook on user.created / user.deleted
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clerkId: text('clerk_id').notNull().unique(),
  email: encryptedText('email').notNull(),
  firstName: encryptedText('first_name'),
  lastName: encryptedText('last_name'),
  optInForUpdates: integer('opt_in_for_updates', { mode: 'boolean' }),
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
  age: encryptedInt('age'),
  gender: encryptedText('gender'),               // single_select
  race: encryptedText('race'),                    // multi_select → JSON string
  ethnicity: encryptedText('ethnicity'),          // multi_select → JSON string
  lgbtq: encryptedText('lgbtq'),                 // single_select

  // === Location (order 6–8) ===
  countryOfResidence: encryptedText('country_of_residence'),
  usState: encryptedText('us_state'),
  usCountyCity: encryptedText('us_county_city'),
  canadianProvince: encryptedText('canadian_province'),

  // === Citizenship (order 9–10) ===
  citizenshipStatus: encryptedText('citizenship_status'),
  visaType: encryptedText('visa_type'),

  // === Education (order 11–18) ===
  educationType: encryptedText('education_type'),       // multi_select → JSON
  degreePursuing: encryptedText('degree_pursuing'),      // multi_select → JSON
  degreesHeld: encryptedText('degrees_held'),            // multi_select → JSON
  yearOfStudy: encryptedText('year_of_study'),           // multi_select → JSON
  enrollmentStatus: encryptedText('enrollment_status'),
  institutionName: encryptedText('institution_name'),
  institutionType: encryptedText('institution_type'),    // multi_select → JSON
  gpa: encryptedReal('gpa'),
  creditHoursCompleted: encryptedInt('credit_hours_completed'),

  // === Academics (order 19–23) ===
  fieldOfStudy: encryptedText('field_of_study'),        // multi → JSON
  minor: encryptedText('minor'),
  satScore: encryptedInt('sat_score'),
  actScore: encryptedInt('act_score'),
  otherTestScores: encryptedText('other_test_scores'),  // JSON map

  // === Financial & Background (order 24–28) ===
  financialNeed: encryptedText('financial_need'),
  military: encryptedText('military'),                  // multi_select → JSON
  firstGeneration: encryptedBoolean('first_generation'),
  fosterCare: encryptedBoolean('foster_care'),
  disability: encryptedText('disability'),
  medicalConditionDetail: encryptedText('medical_condition_detail'), // multi → JSON

  // === Activities & Goals (order 30–32) ===
  communityService: encryptedBoolean('community_service'),
  memberships: encryptedText('memberships'),            // multi → JSON
  careerGoals: encryptedText('career_goals'),           // multi → JSON

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

// ─── Attribute Schema ──────────────────────────────────────
// Stores the questionnaire schema configuration (from attribute_schema.json)
export const attributeSchema = sqliteTable('attribute_schema', {
  key: text('key').primaryKey(),
  config: text('config', { mode: 'json' }).notNull(), // JSON string representing the attribute configuration
});

// ─── Entity Database ───────────────────────────────────────
// Stores the entity lookup options (from entity_db.json)
export const entityDb = sqliteTable('entity_db', {
  category: text('category').primaryKey(),
  entities: text('entities', { mode: 'json' }).notNull(), // JSON string representing the array of entities
});

// ─── Scholarships ──────────────────────────────────────────
// Stores the available scholarships (from current_scholarships.json)
export const scholarships = sqliteTable('scholarships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  link: text('link'),
  organization: text('organization'),
  phoneNumber: text('phone_number'),
  emails: text('emails', { mode: 'json' }), 
  levelOfStudy: text('level_of_study'),
  awardType: text('award_type'),
  purpose: text('purpose'),
  focus: text('focus'),
  qualifications: text('qualifications'),
  criteria: text('criteria'),
  funds: text('funds'),
  duration: text('duration'),
  numberOfAwards: text('number_of_awards'),
  toApply: text('to_apply'),
  deadline: text('deadline'),
  contact: text('contact'),
  forMoreInformation: text('for_more_information', { mode: 'json' }), 
  attributes: text('attributes', { mode: 'json' }), 
  specificRequirements: text('specific_requirements', { mode: 'json' }), 
  criteriaExtracted: text('criteria_extracted', { mode: 'json' }),
  submissionRequirements: text('submission_requirements', { mode: 'json' }),
  month: text('month'),
  deadlineDate: text('deadline_date'),
});
