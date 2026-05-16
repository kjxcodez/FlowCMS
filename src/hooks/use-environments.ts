"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function useEnvironments() {
  return useQuery({
    queryKey: ["environments"],
    queryFn: () => fetchJson(`/api/internal/environments`),
  });
}
