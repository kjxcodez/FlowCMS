"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function useAuditLogs(workspaceId?: string, params?: { days?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.days) queryParams.append("days", params.days.toString());
  
  return useQuery({
    queryKey: ["audit-logs", workspaceId, params],
    queryFn: () => fetchJson(`/api/internal/audit-logs/${workspaceId}?${queryParams.toString()}`),
    enabled: !!workspaceId,
  });
}
