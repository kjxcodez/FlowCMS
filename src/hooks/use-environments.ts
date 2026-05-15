"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function useEnvironments(workspaceId?: string) {
  return useQuery({
    queryKey: ["environments", workspaceId],
    queryFn: () => fetchJson(`/api/internal/environments/${workspaceId}`),
    enabled: !!workspaceId,
  });
}
