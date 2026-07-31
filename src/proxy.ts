import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/questionnaire(.*)",
  "/scholarships(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);

  // Rate Limiting: Apply rate limit checks to API endpoints
  if (url.pathname.startsWith("/api/")) {
    const rateLimitResponse = checkRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // CSRF Protection: Validate Origin / Host for state-changing HTTP methods on API routes
  const method = req.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    // Exclude external webhooks (e.g., Clerk webhooks) which perform signature verification
    if (!url.pathname.startsWith("/api/webhooks/")) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");

      if (origin) {
        try {
          const originUrl = new URL(origin);
          if (originUrl.host !== host) {
            return new NextResponse(
              JSON.stringify({ error: "Forbidden: Cross-Site Request Rejected" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        } catch {
          return new NextResponse(
            JSON.stringify({ error: "Forbidden: Invalid Origin Header" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } else {
        // Fallback check on Referer if Origin header is absent
        const referer = req.headers.get("referer");
        if (referer) {
          try {
            const refererUrl = new URL(referer);
            if (refererUrl.host !== host) {
              return new NextResponse(
                JSON.stringify({ error: "Forbidden: Cross-Site Request Rejected" }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }
          } catch {
            return new NextResponse(
              JSON.stringify({ error: "Forbidden: Invalid Referer Header" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

