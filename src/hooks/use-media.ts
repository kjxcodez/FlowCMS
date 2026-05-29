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

/**
 * useMedia
 * Retrieves media assets based on search keyword and active folderId filter.
 */
export function useMedia(filters?: { folderId?: string | null; q?: string }) {
  const params = new URLSearchParams();
  if (filters?.folderId !== undefined) {
    // We pass "root" to query assets at the root folder specifically,
    // otherwise we pass the cuid of the folder.
    params.append("folderId", filters.folderId === null ? "root" : filters.folderId);
  }
  if (filters?.q) {
    params.append("q", filters.q);
  }

  const queryString = params.toString();
  const url = `/api/internal/media${queryString ? `?${queryString}` : ""}`;

  return useQuery({
    queryKey: ["media", filters],
    queryFn: () => fetchJson(url),
  });
}

/**
 * useUploadMedia
 * Uploads a file, optionally assigning it directly inside an active folderId.
 */
export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId?: string | null }) => {
      const form = new FormData();
      form.append("file", file);
      if (folderId) {
        form.append("folderId", folderId);
      }
      return fetch("/api/internal/media", {
        method: "POST",
        body: form,
      }).then((r) => r.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-folders"] });
    },
  });
}

/**
 * useDeleteMedia
 * Deletes a single media asset.
 */
export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/internal/media/${id}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-folders"] });
    },
  });
}

/**
 * useUpdateMedia
 * Updates alt text, title, caption, or folderId (moves to folder) for a single asset.
 */
export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      title,
      alt,
      caption,
      folderId,
    }: {
      id: string;
      title?: string | null;
      alt?: string | null;
      caption?: string | null;
      folderId?: string | null;
    }) =>
      fetch(`/api/internal/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, alt, caption, folderId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

/**
 * useBulkUpdateMedia
 * Performs batch operations (move or delete) on a list of media assets.
 */
export function useBulkUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      ids: string[];
      action: "move" | "delete";
      targetFolderId?: string | null;
    }) =>
      fetch("/api/internal/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-folders"] });
    },
  });
}

/**
 * useFolders
 * Lists all folders in the workspace.
 */
export function useFolders() {
  return useQuery({
    queryKey: ["media-folders"],
    queryFn: () => fetchJson("/api/internal/media/folders"),
  });
}

/**
 * useCreateFolder
 * Creates a new media folder in the workspace.
 */
export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; parentId?: string | null }) =>
      fetch("/api/internal/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-folders"] });
    },
  });
}

/**
 * useUpdateFolder
 * Renames a folder or changes its parentId (relocates it).
 */
export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      name,
      parentId,
    }: {
      id: string;
      name?: string;
      parentId?: string | null;
    }) =>
      fetch(`/api/internal/media/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-folders"] });
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

/**
 * useDeleteFolder
 * Deletes a folder, moving contents (mode = 'move') or failing if not empty (mode = 'empty').
 */
export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: "empty" | "move" }) =>
      fetch(`/api/internal/media/folders/${id}?mode=${mode}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-folders"] });
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}
