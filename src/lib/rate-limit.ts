import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  HOBBY: { windowMs: 60_000, max: 30 },
  PRO: { windowMs: 60_000, max: 300 },
  TEAM: { windowMs: 60_000, max: 1000 },
  PUBLIC: { windowMs: 60_000, max: 10 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt: now + config.windowMs,
      limit: config.max,
    };
  }

  entry.count++;

  if (entry.count > config.max) {
    logger.warn("Rate limit exceeded", {
      key,
      count: entry.count,
      limit: config.max,
    });
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.max,
    };
  }

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
    limit: config.max,
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
