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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Get monthly usage counter
  const monthlyUsage = await prisma.monthlyUsage.findUnique({
    where: {
      workspaceId_year_month: {
        workspaceId: workspace.id,
        year,
        month,
      }
    }
  });

  // Get storage usage from media files
  const storageResult = await prisma.media.aggregate({
    where: { workspaceId: workspace.id },
    _sum: { size: true }
  });

  // Get content type count
  const contentTypeCount = await prisma.contentType.count({
    where: { workspaceId: workspace.id }
  });

  return apiSuccess({
    apiRequests: monthlyUsage?.apiRequests ?? 0,
    storageBytes: storageResult._sum.size ?? 0,
    contentTypes: contentTypeCount,
    month,
    year,
  });
}
