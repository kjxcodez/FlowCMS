"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const r = await fetch(url);
  const json = await r.json();
  if (!r.ok) {
    throw new Error(json.error?.message || json.message || "Failed to fetch data");
  }
  return json.data;
}

export function useEnvironments() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["environments"],
    queryFn: () => fetchJson(`/api/internal/environments`),
  });

  const createMutation = useMutation({
    mutationFn: (variables: { name: string }) =>
      fetch("/api/internal/environments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error?.message || json.message || "Failed to create environment.");
        return json.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["environments"] }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (envId: string) =>
      fetch(`/api/internal/environments/${envId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error?.message || json.message || "Failed to set default environment.");
        return json.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["environments"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ envId, name }: { envId: string; name: string }) =>
      fetch(`/api/internal/environments/${envId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error?.message || json.message || "Failed to update environment.");
        return json.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["environments"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (envId: string) =>
      fetch(`/api/internal/environments/${envId}`, {
        method: "DELETE",
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error?.message || json.message || "Failed to delete environment.");
        return json.data;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["environments"] }),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    createEnvironment: createMutation.mutateAsync,
    setDefaultEnvironment: setDefaultMutation.mutateAsync,
    updateEnvironment: updateMutation.mutateAsync,
    deleteEnvironment: deleteMutation.mutateAsync,
    createMutation,
    setDefaultMutation,
    updateMutation,
    deleteMutation,
  };
}
