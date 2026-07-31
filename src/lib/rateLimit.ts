import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (fallback when Redis is not configured)
const store = new Map<string, RateLimitStore>();

// Periodically clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now > value.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Limit of requests allowed in the time window */
  limit: number;
  /** Window duration in milliseconds (e.g. 60,000 for 1 minute) */
  windowMs: number;
}

/**
 * Default limits per endpoint pattern
 */
export function getRouteRateLimit(pathname: string, method: string): RateLimitConfig {
  // Heavy compute endpoint: scholarship matching
  if (pathname === "/api/scholarships" && method === "GET") {
    return { limit: 30, windowMs: 60 * 1000 }; // 30 req / min
  }

  // Profile read / update
  if (pathname === "/api/profile") {
    return { limit: 30, windowMs: 60 * 1000 }; // 30 req / min
  }

  // Save / delete scholarships
  if (pathname === "/api/scholarships/save") {
    return { limit: 60, windowMs: 60 * 1000 }; // 60 req / min
  }

  // Requirements responses
  if (pathname === "/api/requirements" || pathname === "/api/requirements/responses") {
    return { limit: 60, windowMs: 60 * 1000 }; // 60 req / min
  }

  // Webhooks have high limits (handled by signature verification)
  if (pathname.startsWith("/api/webhooks/")) {
    return { limit: 200, windowMs: 60 * 1000 };
  }

  // General default API rate limit
  return { limit: 100, windowMs: 60 * 1000 }; // 100 req / min
}

/**
 * Checks rate limit for a client IP and path.
 * Returns null if allowed, or a NextResponse 429 if rate limit is exceeded.
 */
export function checkRateLimit(req: NextRequest): NextResponse | null {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // Extract client IP address from request headers
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.headers.get("x-real-ip") || "127.0.0.1";

  const config = getRouteRateLimit(pathname, method);
  const key = `${ip}:${pathname}:${method}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    store.set(key, entry);
  } else {
    entry.count++;
  }

  const remaining = Math.max(0, config.limit - entry.count);
  const resetSec = Math.ceil((entry.resetTime - now) / 1000);

  if (entry.count > config.limit) {
    return new NextResponse(
      JSON.stringify({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Please try again in ${resetSec} seconds.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(resetSec),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetTime / 1000)),
        },
      }
    );
  }

  return null;
}
