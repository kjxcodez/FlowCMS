"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  return json.data;
}

export function useMedia() {
  return useQuery({
    queryKey: ["media"],
    queryFn: () => fetchJson("/api/internal/media"),
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return fetch("/api/internal/media", {
        method: "POST",
        body: form,
      }).then((r) => r.json());
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["media"] }),
  });
}
export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/internal/media/${id}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["media"] }),
  });
}
