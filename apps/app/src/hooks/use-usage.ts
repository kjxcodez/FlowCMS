"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function useUsage(workspaceId?: string) {
  return useQuery({
    queryKey: ["usage", workspaceId],
    queryFn: () => workspaceId 
      ? fetchJson(`/api/internal/usage/${workspaceId}`)
      : fetchJson("/api/internal/usage"),
    enabled: !!workspaceId,
  });
}

export function useUsageRequests(workspaceId?: string) {
  return useQuery({
    queryKey: ["usage-requests", workspaceId],
    queryFn: () => fetchJson(`/api/internal/usage/${workspaceId}/requests`),
    enabled: !!workspaceId,
  });
}
