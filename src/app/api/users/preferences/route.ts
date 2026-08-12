import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    
    return NextResponse.json({ optInForUpdates: user?.optInForUpdates ?? null });
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // We expect optInForUpdates to be a boolean
    if (typeof body.optInForUpdates !== 'boolean') {
      return NextResponse.json({ error: "Invalid optInForUpdates value" }, { status: 400 });
    }

    await db.update(users)
      .set({ optInForUpdates: body.optInForUpdates })
      .where(eq(users.clerkId, userId));

    return NextResponse.json({ success: true, optInForUpdates: body.optInForUpdates });
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
