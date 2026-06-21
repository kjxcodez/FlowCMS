import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { getStorageUsage } from "@/lib/usage";

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

  // Get storage usage using helper
  const storageBytes = await getStorageUsage(workspace.id);

  // Get collection count
  const collectionCount = await prisma.collection.count({
    where: { workspaceId: workspace.id }
  });

  return apiSuccess({
    apiRequests: monthlyUsage?.apiRequests ?? 0,
    storageBytes,
    collections: collectionCount,
    month,
    year,
  });
}

