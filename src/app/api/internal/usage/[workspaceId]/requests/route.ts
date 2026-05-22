import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspace } = await requireWorkspace();
  const { workspaceId } = await params;
  
  if (workspace.id !== workspaceId) {
    return apiError("FORBIDDEN", "Access denied");
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Use $queryRaw for date truncation as requested
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyStats: any[] = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', "createdAt") as date,
      COUNT(*)::int as requests,
      AVG(duration)::int as avg_latency,
      COUNT(*) FILTER (WHERE "statusCode" >= 400)::int as errors
    FROM "UsageLog"
    WHERE "workspaceId" = ${workspaceId}
      AND "createdAt" > ${thirtyDaysAgo}
    GROUP BY 1
    ORDER BY 1
  `;

  // Also get the last 50 raw logs for the table
  const logs = await prisma.usageLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess({
    dailyStats,
    logs,
  });
}
