import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/types/api";
import { getStorageUsage } from "@/lib/usage";

export const runtime = "nodejs";

export async function GET() {
  const { workspace } = await requireWorkspace();

  const now = new Date();
  const [collections, entries, mediaCount, usage] =
    await Promise.all([
      prisma.collection.count({
        where: { workspaceId: workspace.id },
      }),
      prisma.entry.count({
        where: {
          collection: { workspaceId: workspace.id },
        },
      }),
      prisma.media.count({
        where: { workspaceId: workspace.id },
      }),
      prisma.monthlyUsage.findUnique({
        where: {
          workspaceId_year_month: {
            workspaceId: workspace.id,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
      }),
    ]);

  const storageBytes = await getStorageUsage(workspace.id);

  return apiSuccess({
    collections,
    entries,
    mediaCount,
    apiRequests: usage?.apiRequests ?? 0,
    storageBytes,
  });
}

