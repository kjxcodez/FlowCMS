"use client";

import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  contentTypes: number;
  entries: number;
  pages: number;
  mediaCount: number;
  apiRequests: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const r = await fetch("/api/dashboard/stats");
      const json = await r.json();
      return json.data;
    },
  });
}
