import { prisma } from "./prisma";
import { PLAN_LIMITS } from "@/types/cms";
import { logger } from "./logger";

export async function incrementUsage(
  workspaceId: string
): Promise<void> {
  const now = new Date();
  try {
    await prisma.monthlyUsage.upsert({
      where: {
        workspaceId_year_month: {
          workspaceId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      },
      update: { apiRequests: { increment: 1 } },
      create: {
        workspaceId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        apiRequests: 1,
      },
    });
  } catch (err) {
    logger.error("Failed to increment usage", {
      workspaceId,
      error: String(err),
    });
  }
}

export async function checkUsageLimit(
  workspaceId: string,
  plan: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limits = PLAN_LIMITS[plan];
  if (!limits || limits.apiRequestsPerMonth === -1) {
    return { allowed: true, used: 0, limit: -1 };
  }

  const now = new Date();
  const usage = await prisma.monthlyUsage.findUnique({
    where: {
      workspaceId_year_month: {
        workspaceId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
    },
  });

  const used = usage?.apiRequests ?? 0;
  return {
    allowed: used < limits.apiRequestsPerMonth,
    used,
    limit: limits.apiRequestsPerMonth,
  };
}

export async function checkContentTypeLimit(
  workspaceId: string,
  plan: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limits = PLAN_LIMITS[plan];
  if (!limits || limits.contentTypes === -1) {
    return { allowed: true, used: 0, limit: -1 };
  }

  const count = await prisma.contentType.count({
    where: { workspaceId },
  });
  return {
    allowed: count < limits.contentTypes,
    used: count,
    limit: limits.contentTypes,
  };
}
