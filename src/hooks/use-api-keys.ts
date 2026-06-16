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

export function useApiKeys() {
  const query = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => fetchJson("/api/internal/api-keys"),
  });

  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  return {
    ...query,
    createMutation,
    deleteMutation,
  };
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { name: string; scopes: string[]; environmentId?: string }) =>
      fetch("/api/internal/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.message || "Failed to create API key.");
        return json;
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/internal/api-keys?id=${id}`, {
        method: "DELETE",
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.message || "Failed to delete API key.");
        return json;
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}
