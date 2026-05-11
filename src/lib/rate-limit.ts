import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { logger } from "./logger";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Map Plan to ratelimit instances using sliding window
const limiters = {
  HOBBY: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "rl:hobby",
  }),
  PRO: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, "1 m"),
    prefix: "rl:pro",
  }),
  TEAM: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, "1 m"),
    prefix: "rl:team",
  }),
  PUBLIC: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:public",
  }),
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export async function checkRateLimit(
  key: string,
  plan: string,
  isAdmin = false
): Promise<RateLimitResult> {
  // ADMIN BYPASS: Platform admins skip rate limits for internal dashboard/admin operations.
  // We explicitly still limit them on PUBLIC endpoints to prevent accidental saturation.
  if (isAdmin && plan !== "PUBLIC") {
    return {
      allowed: true,
      remaining: 999,
      resetAt: Date.now() + 60000,
      limit: 999,
    };
  }

  const limiter =
    limiters[plan as keyof typeof limiters] ?? limiters.HOBBY;
  const { success, limit, remaining, reset } = await limiter.limit(key);

  if (!success) {
    logger.warn("Rate limit exceeded", { key, plan });
  }

  return {
    allowed: success,
    remaining,
    resetAt: reset,
    limit,
  };
}

export function rateLimitHeaders(
  result: RateLimitResult
): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
