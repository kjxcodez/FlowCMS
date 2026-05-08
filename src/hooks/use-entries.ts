"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function useEntries(contentTypeId?: string) {
  const params = contentTypeId
    ? `?contentTypeId=${contentTypeId}`
    : "";
  return useQuery({
    queryKey: ["entries", contentTypeId],
    queryFn: () => fetchJson(`/api/internal/entries${params}`),
  });
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: ["entries", "detail", id],
    queryFn: () => fetchJson(`/api/internal/entries/${id}`),
    enabled: !!id,
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      fetch("/api/internal/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["entries"] }),
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetch(`/api/internal/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["entries"] }),
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/internal/entries/${id}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["entries"] }),
  });
}
