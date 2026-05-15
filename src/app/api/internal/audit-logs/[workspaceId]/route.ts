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
  
  if (workspace.id !== workspaceId) {
    return apiError("FORBIDDEN", "Access denied");
  }

  const from = new Date();
  from.setDate(from.getDate() - days);

  const logs = await prisma.auditLog.findMany({
    where: { 
      workspaceId,
      createdAt: { gte: from }
    },
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
