"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function useContentTypes() {
  return useQuery({
    queryKey: ["content-types"],
    queryFn: () => fetchJson("/api/internal/content-types"),
  });
}

export function useContentType(id: string) {
  return useQuery({
    queryKey: ["content-types", id],
    queryFn: () => fetchJson(`/api/internal/content-types/${id}`),
    enabled: !!id,
  });
}

export function useCreateContentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      fetch("/api/internal/content-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["content-types"] }),
  });
}

export function useUpdateContentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetch(`/api/internal/content-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["content-types"] }),
  });
}

export function useDeleteContentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/internal/content-types/${id}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["content-types"] }),
  });
}
