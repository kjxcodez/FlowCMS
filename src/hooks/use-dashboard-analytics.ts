"use client";

import { useQuery } from "@tanstack/react-query";

export interface AnalyticsCounts {
  collections: number;
  entries: number;
  published: number;
  draft: number;
  media: number;
  apiKeys: number;
}

export interface AnalyticsChartItem {
  day: string;
  entries: number;
  apiRequests: number;
  apiSuccess: number;
  apiError: number;
}

export interface GrowthChartItem {
  day: string;
  Collections: number;
  Entries: number;
  Media: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  resourceType: string;
  resourceName: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  } | null;
}

export interface DashboardAnalyticsData {
  counts: AnalyticsCounts;
  chartData: AnalyticsChartItem[];
  growthData: GrowthChartItem[];
  auditLogs: AuditLogItem[];
}

export function useDashboardAnalytics(range = "7d") {
  return useQuery({
    queryKey: ["dashboard-analytics", range],
    queryFn: async (): Promise<DashboardAnalyticsData> => {
      const r = await fetch(`/api/dashboard/analytics?range=${range}`);
      if (!r.ok) {
        throw new Error("Failed to fetch dashboard analytics");
      }
      const json = await r.json();
      return json.data;
    },
  });
}
