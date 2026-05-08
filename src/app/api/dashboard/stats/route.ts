import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export async function GET() {
  const { workspace } = await requireWorkspace();

  const now = new Date();
  const [contentTypes, entries, pages, mediaCount, usage] =
    await Promise.all([
      prisma.contentType.count({
        where: { workspaceId: workspace.id },
      }),
      prisma.entry.count({
        where: {
          contentType: { workspaceId: workspace.id },
        },
      }),
      prisma.page.count({
        where: { workspaceId: workspace.id },
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

  return apiSuccess({
    contentTypes,
    entries,
    pages,
    mediaCount,
    apiRequests: usage?.apiRequests ?? 0,
  });
}
