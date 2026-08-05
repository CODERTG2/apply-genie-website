import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { db } from "../db";
import { userProfiles, scholarships } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Migrating memberships...");

  // 1. Migrate user_profiles
  const profiles = await db.select().from(userProfiles);
  let profilesUpdated = 0;
  for (const profile of profiles) {
    if (profile.memberships) {
      try {
        const mems = JSON.parse(profile.memberships as string);
        if (Array.isArray(mems) && mems.length > 0 && typeof mems[0] === "string") {
          // Convert array of strings to array of objects
          const migrated = mems.map(m => ({ organization: m, status: "Active Member" }));
          await db.update(userProfiles)
            .set({ memberships: JSON.stringify(migrated) })
            .where(eq(userProfiles.id, profile.id));
          profilesUpdated++;
        }
      } catch (e) {
        console.error("Error migrating profile", profile.id, e);
      }
    }
  }
  console.log(`Migrated ${profilesUpdated} user profiles.`);

  // 2. Migrate scholarships
  const allScholarships = await db.select().from(scholarships);
  let scholarshipsUpdated = 0;
  for (const s of allScholarships) {
    if (s.attributes) {
      try {
        const attrs = typeof s.attributes === "string" ? JSON.parse(s.attributes) : s.attributes;
        if (attrs.memberships && Array.isArray(attrs.memberships) && attrs.memberships.length > 0 && typeof attrs.memberships[0] === "string") {
          attrs.memberships = attrs.memberships.map((m: string) => ({ organization: m, status: "Active Member" }));
          await db.update(scholarships)
            .set({ attributes: attrs })
            .where(eq(scholarships.id, s.id));
          scholarshipsUpdated++;
        }
      } catch (e) {
        console.error("Error migrating scholarship", s.id, e);
      }
    }
  }
  console.log(`Migrated ${scholarshipsUpdated} scholarships.`);
  process.exit(0);
}

main().catch(console.error);
