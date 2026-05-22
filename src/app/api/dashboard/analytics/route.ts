import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/types/api";
import { subDays, format } from "date-fns";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { workspace } = await requireWorkspace();

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "7d";
  const daysLimit = range === "90d" ? 90 : range === "30d" ? 30 : 7;
  const cutoffDate = subDays(new Date(), daysLimit);

  // 1. Fetch Content Overview Counters
  const [
    collectionsCount,
    entriesCount,
    publishedCount,
    draftCount,
    mediaCount,
    apiKeysCount,
  ] = await Promise.all([
    prisma.collection.count({
      where: { workspaceId: workspace.id },
    }),
    prisma.entry.count({
      where: { collection: { workspaceId: workspace.id } },
    }),
    prisma.entry.count({
      where: {
        collection: { workspaceId: workspace.id },
        status: "PUBLISHED",
      },
    }),
    prisma.entry.count({
      where: {
        collection: { workspaceId: workspace.id },
        status: "DRAFT",
      },
    }),
    prisma.media.count({
      where: { workspaceId: workspace.id },
    }),
    prisma.apiKey.count({
      where: { workspaceId: workspace.id },
    }),
  ]);

  // 2. Fetch Entries Created over Time (Grouped by Day)
  const entries = await prisma.entry.findMany({
    where: {
      collection: { workspaceId: workspace.id },
      createdAt: { gte: cutoffDate },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 3. Fetch API Usage Logs over Time (Grouped by Day)
  const usageLogs = await prisma.usageLog.findMany({
    where: {
      workspaceId: workspace.id,
      createdAt: { gte: cutoffDate },
    },
    select: {
      createdAt: true,
      statusCode: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 4. Fetch Recent Activity Feed (Audit Logs)
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      workspaceId: workspace.id,
    },
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Map dates into daily buckets to prevent empty charts
  const dateMap: Record<string, { entries: number; apiRequests: number; apiSuccess: number; apiError: number }> = {};
  
  // Initialize date mapping for all days in the range
  for (let i = daysLimit - 1; i >= 0; i--) {
    const dStr = format(subDays(new Date(), i), "MMM dd");
    dateMap[dStr] = { entries: 0, apiRequests: 0, apiSuccess: 0, apiError: 0 };
  }

  // Count entries into their daily buckets
  entries.forEach(e => {
    const dStr = format(e.createdAt, "MMM dd");
    if (dateMap[dStr]) {
      dateMap[dStr].entries += 1;
    }
  });

  // Count API requests into daily buckets
  usageLogs.forEach(log => {
    const dStr = format(log.createdAt, "MMM dd");
    if (dateMap[dStr]) {
      dateMap[dStr].apiRequests += 1;
      if (log.statusCode >= 200 && log.statusCode < 400) {
        dateMap[dStr].apiSuccess += 1;
      } else {
        dateMap[dStr].apiError += 1;
      }
    }
  });

  // Convert map to ordered list
  const chartData = Object.entries(dateMap).map(([day, values]) => ({
    day,
    ...values,
  }));

  // Fetch collections growth over time
  const collectionsList = await prisma.collection.findMany({
    where: { workspaceId: workspace.id },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const mediaList = await prisma.media.findMany({
    where: { workspaceId: workspace.id },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Accumulate collection & media growth
  const collectionsGrowthMap: Record<string, number> = {};
  const mediaGrowthMap: Record<string, number> = {};

  for (let i = daysLimit - 1; i >= 0; i--) {
    const dStr = format(subDays(new Date(), i), "MMM dd");
    collectionsGrowthMap[dStr] = 0;
    mediaGrowthMap[dStr] = 0;
  }

  collectionsList.forEach(c => {
    const dStr = format(c.createdAt, "MMM dd");
    if (collectionsGrowthMap[dStr] !== undefined) {
      collectionsGrowthMap[dStr] += 1;
    }
  });

  mediaList.forEach(m => {
    const dStr = format(m.createdAt, "MMM dd");
    if (mediaGrowthMap[dStr] !== undefined) {
      mediaGrowthMap[dStr] += 1;
    }
  });

  // Transform growth data into cumulative counts
  let cumCollections = 0;
  let cumEntries = 0;
  let cumMedia = 0;

  // We want to calculate the counts *before* the cutoff date to accurately track growth
  const initialCollections = await prisma.collection.count({
    where: {
      workspaceId: workspace.id,
      createdAt: { lt: cutoffDate },
    },
  });
  const initialEntries = await prisma.entry.count({
    where: {
      collection: { workspaceId: workspace.id },
      createdAt: { lt: cutoffDate },
    },
  });
  const initialMedia = await prisma.media.count({
    where: {
      workspaceId: workspace.id,
      createdAt: { lt: cutoffDate },
    },
  });

  cumCollections = initialCollections;
  cumEntries = initialEntries;
  cumMedia = initialMedia;

  const growthData = chartData.map(data => {
    const day = data.day;
    cumCollections += collectionsGrowthMap[day] || 0;
    cumEntries += data.entries;
    cumMedia += mediaGrowthMap[day] || 0;
    
    return {
      day,
      Collections: cumCollections,
      Entries: cumEntries,
      Media: cumMedia,
    };
  });

  return apiSuccess({
    counts: {
      collections: collectionsCount,
      entries: entriesCount,
      published: publishedCount,
      draft: draftCount,
      media: mediaCount,
      apiKeys: apiKeysCount,
    },
    chartData,
    growthData,
    auditLogs: auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      resourceType: log.resourceType,
      resourceName: log.resourceName,
      createdAt: log.createdAt,
      user: log.user ? { name: log.user.name, email: log.user.email } : null,
    })),
  });
}
