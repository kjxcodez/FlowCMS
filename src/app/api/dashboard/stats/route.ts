import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/types/api";

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

  const storageResult = await prisma.media.aggregate({
    where: { workspaceId: workspace.id },
    _sum: { size: true }
  });

  return apiSuccess({
    collections,
    entries,
    mediaCount,
    apiRequests: usage?.apiRequests ?? 0,
    storageBytes: storageResult._sum.size ?? 0,
  });
}
