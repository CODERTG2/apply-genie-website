import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { Webhook } from "svix";

// Clerk webhook event types we care about
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
  };
};

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    // In development without webhooks configured, allow direct sync
    console.warn("CLERK_WEBHOOK_SECRET not set. Skipping webhook verification.");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Verify the webhook signature
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // Handle events
  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = event.data;
    const email = email_addresses?.[0]?.email_address ?? "";

    await db.insert(users).values({
      clerkId: id,
      email,
      firstName: first_name ?? null,
      lastName: last_name ?? null,
    }).onConflictDoNothing();

    return Response.json({ success: true });
  }

  if (event.type === "user.deleted") {
    const { id } = event.data;
    await db.delete(users).where(eq(users.clerkId, id));
    return Response.json({ success: true });
  }

  return Response.json({ received: true });
}
