import { Redis } from "@upstash/redis";
import { prisma } from "./prisma";
import { PLAN_LIMITS } from "@/types/cms";
import { logger } from "./logger";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function incrementUsage(
  workspaceId: string
): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const redisKey = `usage:${workspaceId}:${year}:${month}`;

  try {
    // 1. Increment in Redis (Atomic & Blocking - very fast)
    await redis.incr(redisKey);

    // 2. Increment in Postgres (Fire-and-forget to prevent blocking API response)
    // We don't await this. If it fails, we rely on the Redis count and occasional syncs.
    prisma.monthlyUsage.upsert({
      where: {
        workspaceId_year_month: {
          workspaceId,
          year,
          month,
        },
      },
      update: { apiRequests: { increment: 1 } },
      create: {
        workspaceId,
        year,
        month,
        apiRequests: 1,
      },
    }).catch((err) => {
        logger.error("Background usage sync failed", {
            workspaceId,
            error: String(err),
        });
    });

  } catch (err) {
    logger.error("Failed to increment usage in Redis", {
      workspaceId,
      error: String(err),
    });
  }
}

export async function checkUsageLimit(
  workspaceId: string,
  plan: string,
  isAdmin = false
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (isAdmin) return { allowed: true, used: 0, limit: -1 };
  const limits = PLAN_LIMITS[plan];
  if (!limits || limits.apiRequestsPerMonth === -1) {
    return { allowed: true, used: 0, limit: -1 };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const redisKey = `usage:${workspaceId}:${year}:${month}`;

  // 1. Try Redis first (Single round-trip)
  let used = await redis.get<number>(redisKey);

  // 2. Fallback to DB if Redis is empty (Cache miss)
  if (used === null) {
    const usage = await prisma.monthlyUsage.findUnique({
      where: {
        workspaceId_year_month: {
          workspaceId,
          year,
          month,
        },
      },
    });
    used = usage?.apiRequests ?? 0;
    // Backfill Redis with 1 hour TTL for safety
    await redis.set(redisKey, used, { ex: 3600 });
  }

  return {
    allowed: used < limits.apiRequestsPerMonth,
    used,
    limit: limits.apiRequestsPerMonth,
  };
}

export async function checkCollectionLimit(
  workspaceId: string,
  plan: string,
  isAdmin = false
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (isAdmin) return { allowed: true, used: 0, limit: -1 };
  const limits = PLAN_LIMITS[plan];
  if (!limits || limits.collections === -1) {
    return { allowed: true, used: 0, limit: -1 };
  }

  const count = await prisma.collection.count({
    where: { workspaceId },
  });
  return {
    allowed: count < limits.collections,
    used: count,
    limit: limits.collections,
  };
}
