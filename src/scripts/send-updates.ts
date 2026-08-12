import { Resend } from "resend";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables (from .env or .env.local)
dotenv.config();
dotenv.config({ path: ".env.local" });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set in your environment variables.");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function main() {
  const args = process.argv.slice(2);
  const subject = args[0];
  const body = args[1];

  if (!subject || !body) {
    console.error("❌ Usage: npx tsx src/scripts/send-updates.ts \"Subject\" \"Email Body (HTML allowed)\"");
    process.exit(1);
  }

  console.log("🔍 Finding users subscribed to updates...");

  // Fetch all users who have opted in
  const subscribedUsers = await db
    .select()
    .from(users)
    .where(eq(users.optInForUpdates, true));

  // Deduplicate by email so we don't send multiple emails to the same address
  const uniqueUsers = [];
  const seenEmails = new Set();
  for (const user of subscribedUsers) {
    if (!seenEmails.has(user.email)) {
      seenEmails.add(user.email);
      uniqueUsers.push(user);
    }
  }

  if (uniqueUsers.length === 0) {
    console.log("ℹ️ No users are currently subscribed to updates.");
    process.exit(0);
  }

  console.log(`✉️ Sending updates to ${uniqueUsers.length} user(s)...`);

  let successCount = 0;
  let failCount = 0;

  for (const user of uniqueUsers) {
    // Decrypt email address (because the email field uses encryptedText)
    // Wait, the encryptedText customType in schema.ts automatically handles decryption 
    // when we fetch it via Drizzle. So user.email is already the raw email string.
    
    try {
      const { data, error } = await resend.emails.send({
        from: "Apply-Genie Updates <updates@scholarshiphq.online>",
        to: [user.email],
        subject: subject,
        html: body,
      });

      if (error) {
        console.error(`❌ Failed to send to ${user.email}:`, error);
        failCount++;
      } else {
        console.log(`✅ Sent to ${user.email} (ID: ${data?.id})`);
        successCount++;
      }
    } catch (e) {
      console.error(`❌ Unexpected error sending to ${user.email}:`, e);
      failCount++;
    }
  }

  console.log("\n🎉 Finished sending updates!");
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
