import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/types/api";
import { PLAN_LIMITS } from "@/types/cms";

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

  return apiSuccess({
    plan: workspace.plan,
    limits,
    current: {
      apiRequests: currentMonth?.apiRequests ?? 0,
      collections: await prisma.collection.count({
        where: { workspaceId: workspace.id },
      }),
    },
    history: months,
  });
}
