"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  if (!r.ok) {
    throw new Error(json.message || "Failed to fetch data");
  }
  return json.data;
}

export function useWebhooks() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["webhooks"],
    queryFn: () => fetchJson("/api/internal/webhooks"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { url: string; events: string[] }) =>
      fetch("/api/internal/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.message || "Failed to create webhook.");
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/internal/webhooks?id=${id}`, {
        method: "DELETE",
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.message || "Failed to delete webhook.");
        return json;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });

  return {
    webhooks: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    createWebhook: createMutation.mutateAsync,
    deleteWebhook: deleteMutation.mutateAsync,
    mutate: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  };
}
