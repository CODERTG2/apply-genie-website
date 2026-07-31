import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

async function migrate() {
  console.log('🚀 Starting Data Migration to Turso with Encryption...');

  // 1. Setup Local DB (Unencrypted Source)
  // We use execute() to get raw rows without triggering the Drizzle decryptor
  const localClient = createClient({ url: 'file:apply-genie.db' });
  console.log('✅ Connected to local apply-genie.db');

  // 2. Setup Turso DB (Encrypted Destination)
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
  if (!tursoUrl || !tursoAuthToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  }

  const tursoClient = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });
  // The Turso Drizzle instance WILL use the schema, meaning inserts will automatically encrypt!
  const tursoDb = drizzleLibsql(tursoClient, { schema });
  console.log('✅ Connected to remote Turso database');

  try {
    // Migrate Users
    const { rows: localUsers } = await localClient.execute('SELECT * FROM users');
    console.log(`\nFound ${localUsers.length} users to migrate.`);
    for (const user of localUsers) {
      // Map raw snake_case to schema camelCase
      const mappedUser = {
        id: Number(user.id),
        clerkId: String(user.clerk_id),
        email: String(user.email),
        firstName: user.first_name ? String(user.first_name) : null,
        lastName: user.last_name ? String(user.last_name) : null,
        createdAt: String(user.created_at || new Date().toISOString()),
        updatedAt: String(user.updated_at || new Date().toISOString()),
      };
      
      // Upsert
      const existing = await tursoDb.select().from(schema.users).where(eq(schema.users.clerkId, mappedUser.clerkId)).all();
      if (existing.length === 0) {
        await tursoDb.insert(schema.users).values(mappedUser);
      }
    }
    console.log(`✅ Users migrated & encrypted.`);

    // Migrate User Profiles
    const { rows: localProfiles } = await localClient.execute('SELECT * FROM user_profiles');
    console.log(`\nFound ${localProfiles.length} user profiles to migrate.`);
    for (const profile of localProfiles) {
      const mappedProfile = {
        id: Number(profile.id),
        userId: String(profile.user_id),
        age: profile.age !== null ? Number(profile.age) : null,
        gender: profile.gender ? String(profile.gender) : null,
        race: profile.race ? String(profile.race) : null,
        ethnicity: profile.ethnicity ? String(profile.ethnicity) : null,
        lgbtq: profile.lgbtq ? String(profile.lgbtq) : null,
        countryOfResidence: profile.country_of_residence ? String(profile.country_of_residence) : null,
        usState: profile.us_state ? String(profile.us_state) : null,
        usCountyCity: profile.us_county_city ? String(profile.us_county_city) : null,
        canadianProvince: profile.canadian_province ? String(profile.canadian_province) : null,
        citizenshipStatus: profile.citizenship_status ? String(profile.citizenship_status) : null,
        visaType: profile.visa_type ? String(profile.visa_type) : null,
        educationType: profile.education_type ? String(profile.education_type) : null,
        degreePursuing: profile.degree_pursuing ? String(profile.degree_pursuing) : null,
        yearOfStudy: profile.year_of_study ? String(profile.year_of_study) : null,
        enrollmentStatus: profile.enrollment_status ? String(profile.enrollment_status) : null,
        institutionName: profile.institution_name ? String(profile.institution_name) : null,
        institutionType: profile.institution_type ? String(profile.institution_type) : null,
        gpa: profile.gpa !== null ? Number(profile.gpa) : null,
        creditHoursCompleted: profile.credit_hours_completed !== null ? Number(profile.credit_hours_completed) : null,
        fieldOfStudy: profile.field_of_study ? String(profile.field_of_study) : null,
        minor: profile.minor ? String(profile.minor) : null,
        satScore: profile.sat_score !== null ? Number(profile.sat_score) : null,
        actScore: profile.act_score !== null ? Number(profile.act_score) : null,
        otherTestScores: profile.other_test_scores ? String(profile.other_test_scores) : null,
        financialNeed: profile.financial_need ? String(profile.financial_need) : null,
        military: profile.military ? String(profile.military) : null,
        firstGeneration: profile.first_generation === 1 || profile.first_generation === 'true',
        fosterCare: profile.foster_care === 1 || profile.foster_care === 'true',
        disability: profile.disability ? String(profile.disability) : null,
        medicalConditionDetail: profile.medical_condition_detail ? String(profile.medical_condition_detail) : null,
        communityService: profile.community_service === 1 || profile.community_service === 'true',
        memberships: profile.memberships ? String(profile.memberships) : null,
        careerGoals: profile.career_goals ? String(profile.career_goals) : null,
        questionnaireCompleted: profile.questionnaire_completed === 1 || profile.questionnaire_completed === 'true',
        lastUpdated: String(profile.last_updated || new Date().toISOString()),
      };

      const existing = await tursoDb.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, mappedProfile.userId)).all();
      if (existing.length === 0) {
        await tursoDb.insert(schema.userProfiles).values(mappedProfile);
      }
    }
    console.log(`✅ User Profiles migrated & encrypted.`);

    // Migrate Saved Scholarships
    const { rows: localScholarships } = await localClient.execute('SELECT * FROM saved_scholarships');
    console.log(`\nFound ${localScholarships.length} saved scholarships to migrate.`);
    for (const scholarship of localScholarships) {
      const mapped = {
        id: Number(scholarship.id),
        userId: String(scholarship.user_id),
        scholarshipTitle: String(scholarship.scholarship_title),
        savedAt: String(scholarship.saved_at || new Date().toISOString()),
      };
      
      const existing = await tursoDb.select().from(schema.savedScholarships)
        .where(eq(schema.savedScholarships.id, mapped.id)).all();
      if (existing.length === 0) {
        await tursoDb.insert(schema.savedScholarships).values(mapped);
      }
    }
    console.log(`✅ Saved Scholarships migrated.`);

    // Migrate Requirement Responses
    const { rows: localResponses } = await localClient.execute('SELECT * FROM user_requirement_responses');
    console.log(`\nFound ${localResponses.length} requirement responses to migrate.`);
    for (const response of localResponses) {
      const mapped = {
        id: Number(response.id),
        userId: String(response.user_id),
        requirement: String(response.requirement),
        isMet: response.is_met === 1 || response.is_met === 'true',
        answeredAt: String(response.answered_at || new Date().toISOString()),
      };
      
      const existing = await tursoDb.select().from(schema.userRequirementResponses)
        .where(eq(schema.userRequirementResponses.id, mapped.id)).all();
      if (existing.length === 0) {
        await tursoDb.insert(schema.userRequirementResponses).values(mapped);
      }
    }
    console.log(`✅ Requirement Responses migrated.`);

    console.log('\n🎉 Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    localClient.close();
  }
}

migrate();
