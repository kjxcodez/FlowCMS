import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/types/api";
import { PLAN_LIMITS } from "@/types/cms";
import { getStorageUsage } from "@/lib/usage";

export async function GET() {
  const { workspace } = await requireWorkspace();
  const now = new Date();

  const months = await prisma.monthlyUsage.findMany({
    where: {
      workspaceId: workspace.id,
      year: { gte: now.getFullYear() - 1 },
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  const currentMonth = months.find(
    (m) =>
      m.year === now.getFullYear() &&
      m.month === now.getMonth() + 1
  );

  const limits = PLAN_LIMITS[workspace.plan];

  const currentStorageBytes = await getStorageUsage(workspace.id);

  const historyWithCumulativeStorage = await Promise.all(
    months.map(async (m) => {
      const endOfMonth = new Date(m.year, m.month, 0, 23, 59, 59, 999);
      const agg = await prisma.media.aggregate({
        where: {
          workspaceId: workspace.id,
          createdAt: { lte: endOfMonth },
        },
        _sum: { size: true }
      });
      return {
        ...m,
        storageBytes: agg._sum.size ?? 0,
      };
    })
  );

  return apiSuccess({
    plan: workspace.plan,
    limits,
    current: {
      apiRequests: currentMonth?.apiRequests ?? 0,
      collections: await prisma.collection.count({
        where: { workspaceId: workspace.id },
      }),
      storageBytes: currentStorageBytes,
    },
    history: historyWithCumulativeStorage,
  });
}

