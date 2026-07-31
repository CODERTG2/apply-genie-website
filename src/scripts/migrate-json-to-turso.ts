import { db } from '../db';
import { attributeSchema, entityDb, scholarships } from '../db/schema';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function migrate() {
  console.log('Starting migration to Turso...');

  try {
    // 1. Migrate Attribute Schema
    console.log('Migrating attribute schema...');
    const schemaPath = path.join(process.cwd(), 'attribute_schema.json');
    const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    // Clear existing data (optional, but good for idempotency)
    await db.delete(attributeSchema);
    
    for (const [key, config] of Object.entries(schemaData)) {
      await db.insert(attributeSchema).values({
        key,
        config: config as any
      });
    }
    console.log(`✅ Migrated ${Object.keys(schemaData).length} attribute schema keys.`);

    // 2. Migrate Entity DB
    console.log('Migrating entity DB...');
    const entityPath = path.join(process.cwd(), 'entity_db.json');
    const entityData = JSON.parse(fs.readFileSync(entityPath, 'utf8'));
    
    await db.delete(entityDb);
    
    for (const [category, entities] of Object.entries(entityData)) {
      await db.insert(entityDb).values({
        category,
        entities: entities as any
      });
    }
    console.log(`✅ Migrated ${Object.keys(entityData).length} entity categories.`);

    // 3. Migrate Scholarships
    console.log('Migrating scholarships...');
    const scholarshipsPath = path.join(process.cwd(), 'current_scholarships.json');
    const scholarshipsData = JSON.parse(fs.readFileSync(scholarshipsPath, 'utf8'));
    
    await db.delete(scholarships);
    
    let scholarshipCount = 0;
    // Batch inserts for scholarships
    const batchSize = 50;
    for (let i = 0; i < scholarshipsData.length; i += batchSize) {
      const batch = scholarshipsData.slice(i, i + batchSize);
      
      const values = batch.map((s: any) => ({
        title: s.Title || 'Unknown Title',
        link: s.Link || null,
        organization: s.Organization || null,
        phoneNumber: s['Phone Number'] || null,
        emails: s.Emails || null,
        levelOfStudy: s['Level of Study'] || null,
        awardType: s['Award Type'] || null,
        purpose: s.Purpose || null,
        focus: s.Focus || null,
        qualifications: s.Qualifications || null,
        criteria: s.Criteria || null,
        funds: s.Funds || null,
        duration: s.Duration || null,
        numberOfAwards: s['Number of Awards'] || null,
        toApply: s['To Apply'] || null,
        deadline: s.Deadline || null,
        contact: s.Contact || null,
        forMoreInformation: s['For more information'] || null,
        attributes: s.Attributes || null,
        specificRequirements: s.SpecificRequirements || null,
        month: s.Month || null,
        deadlineDate: s.Deadline_Date || null,
      }));

      await db.insert(scholarships).values(values);
      scholarshipCount += values.length;
      console.log(`...inserted ${scholarshipCount}/${scholarshipsData.length} scholarships`);
    }

    console.log(`✅ Migrated ${scholarshipCount} scholarships.`);
    console.log('🎉 Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
