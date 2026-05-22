import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { workspaceId } = await params;
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");
  const action = searchParams.get("action");
  const resourceType = searchParams.get("resourceType");
  const query = searchParams.get("query");
  
  if (workspace.id !== workspaceId) {
    return apiError("FORBIDDEN", "Access denied");
  }

  const from = new Date();
  from.setDate(from.getDate() - days);

  const where: any = {  // eslint-disable-line @typescript-eslint/no-explicit-any
    workspaceId,
    createdAt: { gte: from }
  };

  if (action) where.action = action;
  if (resourceType) where.resourceType = resourceType;
  if (query) {
    where.OR = [
      { action: { contains: query, mode: 'insensitive' } },
      { resourceType: { contains: query, mode: 'insensitive' } },
      { resourceId: { contains: query, mode: 'insensitive' } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Fetch unique user data since AuditLog doesn't have direct relation in schema
  const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))] as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const enrichedLogs = logs.map(log => ({
    ...log,
    user: log.userId ? userMap[log.userId] : null,
  }));

  return apiSuccess(enrichedLogs);
}
