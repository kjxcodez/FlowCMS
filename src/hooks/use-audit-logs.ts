"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export interface AuditLogParams {
  days?: number;
  action?: string;
  resourceType?: string;
  query?: string;
}

export function useAuditLogs(workspaceId?: string, params?: AuditLogParams) {
  const queryParams = new URLSearchParams();
  if (params?.days) queryParams.append("days", params.days.toString());
  if (params?.action) queryParams.append("action", params.action);
  if (params?.resourceType) queryParams.append("resourceType", params.resourceType);
  if (params?.query) queryParams.append("query", params.query);
  
  return useQuery({
    queryKey: ["audit-logs", workspaceId, params],
    queryFn: () => fetchJson(`/api/internal/audit-logs/${workspaceId}?${queryParams.toString()}`),
    enabled: !!workspaceId,
  });
}
