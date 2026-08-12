import { Resend } from "resend";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set.");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

function getEmailHtml(firstName: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    /* Default (Light Mode) */
    :root {
      color-scheme: light dark;
      --bg-base: #F7F5F0;
      --bg-surface: #FFFFFF;
      --text-heading: #0F1B2D;
      --text-body: #1E293B;
      --brand-gold: #E8A838;
      --border-subtle: #E2E8F0;
      --accent-main: #2563EB;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-body);
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .card {
      background-color: var(--bg-surface);
      border-radius: 16px;
      border: 1px solid var(--border-subtle);
      padding: 32px;
      box-shadow: 0 4px 12px rgba(15, 27, 45, 0.06);
    }
    
    h1 {
      color: var(--text-heading);
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    p {
      color: var(--text-body);
      font-size: 16px;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 24px;
    }

    .btn {
      display: inline-block;
      background-color: var(--brand-gold);
      color: #0F1B2D;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
    }

    .footer {
      text-align: center;
      margin-top: 32px;
      color: #64748B;
      font-size: 14px;
    }

    /* Dark Mode overrides */
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-base: #0A0F17;
        --bg-surface: #121A25;
        --text-heading: #F7F5F0;
        --text-body: #A5B6C9;
        --brand-gold: #E8A838;
        --border-subtle: #1E2A3C;
        --accent-main: #528BFF;
      }
      
      .card {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
      }
      
      .btn {
        color: #0A0F17;
      }

      .footer {
        color: #6B7C93;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Hello ${firstName}!</h1>
      <p>This is a test email sent from <strong>ScholarshipHQ</strong>. If your device is set to Dark Mode, this email should automatically switch to our beautiful dark theme to match your system!</p>
      
      <p>We are constantly working on new features to help you find the best scholarships. Stay tuned for our next big update.</p>
      
      <a href="https://scholarshiphq.online/dashboard" class="btn">Go to Dashboard</a>
    </div>
    <div class="footer">
      <p>You are receiving this because you opted in to updates.</p>
    </div>
  </div>
</body>
</html>
  `;
}

async function main() {
  console.log("🔍 Finding users subscribed to updates...");

  // Dynamically import db and schema after dotenv is loaded
  const { db } = await import("../db");
  const { users } = await import("../db/schema");

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

  console.log(`✉️ Sending test email to ${uniqueUsers.length} user(s)...`);

  for (const user of uniqueUsers) {
    const name = user.firstName || "there";

    try {
      const { data, error } = await resend.emails.send({
        from: "Apply-Genie Updates <updates@scholarshiphq.online>",
        to: [user.email],
        subject: "Testing our new email system!",
        html: getEmailHtml(name),
      });

      if (error) {
        console.error(`❌ Failed to send to ${user.email}:`, error);
      } else {
        console.log(`✅ Sent to ${user.email} (ID: ${data?.id})`);
      }
    } catch (e) {
      console.error(`❌ Error sending to ${user.email}:`, e);
    }
  }

  console.log("🎉 Finished sending test emails!");
  process.exit(0);
}

main().catch(console.error);
