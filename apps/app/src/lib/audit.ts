import { prisma } from "./prisma";
import { logger } from "./logger";
import { Plan, AuditAction } from "@/generated/prisma";

export async function logAction({
  workspaceId,
  userId,
  apiKeyId,
  action,
  resourceType,
  resourceId,
  resourceName,
  before,
  after,
  ip,
  userAgent,
  plan,
}: {
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
  plan?: Plan;
}) {
  let resolvedPlan = plan;
  try {
    if (!resolvedPlan) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { plan: true },
      });
      resolvedPlan = workspace?.plan ?? Plan.HOBBY;
    }
  } catch (err) {
    logger.error("Failed to resolve workspace plan for audit log", { error: String(err), workspaceId });
    resolvedPlan = Plan.HOBBY;
  }

  const createPromise = prisma.auditLog.create({
    data: {
      workspaceId,
      userId,
      apiKeyId,
      action,
      resourceType,
      resourceId,
      resourceName,
      before: before ? JSON.parse(JSON.stringify(before)) : undefined,
      after: after ? JSON.parse(JSON.stringify(after)) : undefined,
      ip,
      userAgent,
    },
  });

  if (resolvedPlan === Plan.AGENCY || resolvedPlan === Plan.ENTERPRISE) {
    await createPromise;
  } else {
    createPromise.catch((err) => {
      logger.error("Failed to persist audit log", { error: String(err), workspaceId });
    });
  }
}

