import { prisma } from "./prisma";
import { logger } from "./logger";

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
}: {
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
  action: any; // Using any to avoid rigid enum dependencies during development
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
}) {
  try {
    // Fire and forget
    prisma.auditLog.create({
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
    }).catch((err) => {
      logger.error("Failed to persist audit log", { error: String(err), workspaceId });
    });
  } catch (err) {
    logger.error("Audit log service exception", { error: String(err), workspaceId });
  }
}
