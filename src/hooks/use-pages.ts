"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function usePages() {
  return useQuery({
    queryKey: ["pages"],
    queryFn: () => fetchJson("/api/internal/pages"),
  });
}

export function usePage(id: string) {
  return useQuery({
    queryKey: ["pages", id],
    queryFn: () => fetchJson(`/api/internal/pages/${id}`),
    enabled: !!id,
  });
}

export function useCreatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      fetch("/api/internal/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetch(`/api/internal/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/internal/pages/${id}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}
