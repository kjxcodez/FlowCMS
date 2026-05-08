"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: () => fetchJson("/api/internal/usage"),
  });
}
