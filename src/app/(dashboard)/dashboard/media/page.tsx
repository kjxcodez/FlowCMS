"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Image as ImageIcon,
  Plus,
  Search,
  Grid,
  List as ListIcon,
  Copy,
  Trash2,
  UploadCloud,
  Sparkles,
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  Info,
  AlertTriangle,
  FileText,
  Maximize2,
  Download,
  Edit2,
  CheckCircle2,
  FileCode,
  CornerDownRight
} from "lucide-react";
import {
  useMedia,
  useUploadMedia,
  useDeleteMedia,
  useUpdateMedia,
  useBulkUpdateMedia,
  useFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder
} from "@/hooks/use-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  title: string | null;
  alt: string | null;
  caption: string | null;
  size: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  folderId: string | null;
  createdAt: string;
}

interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNode[];
}

interface MediaFolderItem {
  id: string;
  name: string;
  parentId: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export default function MediaPage() {
  // --- UI Layout & Navigation States ---
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = All Assets (recursive)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // --- Drag & Drop visual tracking ---
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  
  // --- Selection States ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // --- Inline metadata edit buffers ---
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // --- Popover & Dialog Modals ---
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const [deleteFolderModal, setDeleteFolderModal] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);
  const [deleteFolderMode, setDeleteFolderMode] = useState<"empty" | "move">("move");
  
  const [renameFolderModal, setRenameFolderModal] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  
  const [bulkMoveModal, setBulkMoveModal] = useState<{ isOpen: boolean; targetFolderId: string | null } | null>(null);
  
  // --- Usage Tracking Cache ---
  const [assetUsages, setAssetUsages] = useState<{ type: string; name: string; id: string }[]>([]);
  const [isUsagesLoading, setIsUsagesLoading] = useState(false);

  // --- API React Query hooks ---
  const { data: rawFolders = [] } = useFolders();
  const { data: rawMedia = [], isLoading: isMediaLoading } = useMedia({
    folderId: activeFolderId,
    q: debouncedSearch,
  });

  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const updateMediaMutation = useUpdateMedia();
  const bulkUpdateMutation = useBulkUpdateMedia();

  const createFolderMutation = useCreateFolder();
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();

  // --- Search debounce effect ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // --- Restore view layout preferences ---
  useEffect(() => {
    const stored = localStorage.getItem("flowcms-media-view");
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
  }, []);

  const changeView = (newView: "grid" | "list") => {
    setView(newView);
    localStorage.setItem("flowcms-media-view", newView);
  };

  // --- Construct folder hierarchy ---
  const folderTree = useMemo(() => {
    const map: Record<string, FolderNode> = {};
    const roots: FolderNode[] = [];
    const foldersList = (rawFolders || []) as MediaFolderItem[];

    foldersList.forEach((f) => {
      map[f.id] = { id: f.id, name: f.name, parentId: f.parentId, children: [] };
    });

    foldersList.forEach((f) => {
      if (f.parentId && map[f.parentId]) {
        map[f.parentId].children.push(map[f.id]);
      } else {
        roots.push(map[f.id]);
      }
    });

    return roots;
  }, [rawFolders]);

  // Map folder references for rapid lookup
  const folderMap = useMemo(() => {
    const map: Record<string, MediaFolderItem> = {};
    const foldersList = (rawFolders || []) as MediaFolderItem[];
    foldersList.forEach((f) => {
      map[f.id] = f;
    });
    return map;
  }, [rawFolders]);

  // --- Selected Asset reference ---
  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    return (rawMedia as MediaItem[]).find((m) => m.id === selectedAssetId) || null;
  }, [selectedAssetId, rawMedia]);

  // --- Fetch references for inspector usage tracking ---
  useEffect(() => {
    if (!selectedAssetId || !selectedAsset) {
      setAssetUsages([]);
      return;
    }

    setIsUsagesLoading(true);
    fetch(`/api/internal/media/${selectedAssetId}/usage`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setAssetUsages(json.data);
        }
      })
      .catch((err) => console.error("Failed to query usages", err))
      .finally(() => setIsUsagesLoading(false));

    // Reset buffer
    setEditTitle(selectedAsset.title || "");
    setEditAlt(selectedAsset.alt || "");
    setEditCaption(selectedAsset.caption || "");
    setSaveStatus("idle");
  }, [selectedAssetId, selectedAsset]);

  // --- Dynamic Breadcrumbs Generator ---
  const breadcrumbs = useMemo(() => {
    if (!activeFolderId) return [{ id: null, name: "All Assets" }];
    const chain: { id: string | null; name: string }[] = [];
    let currentId: string | null = activeFolderId;
    
    while (currentId) {
      const folder = folderMap[currentId];
      if (!folder) break;
      chain.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }
    
    chain.unshift({ id: null, name: "Media" });
    return chain;
  }, [activeFolderId, folderMap]);

  // --- Metadata Inline Editing Save ---
  const handleSaveMetadata = () => {
    if (!selectedAssetId) return;
    setSaveStatus("saving");
    updateMediaMutation.mutate(
      {
        id: selectedAssetId,
        title: editTitle.trim() === "" ? null : editTitle,
        alt: editAlt.trim() === "" ? null : editAlt,
        caption: editCaption.trim() === "" ? null : editCaption,
      },
      {
        onSuccess: () => {
          setSaveStatus("saved");
          toast.success("Asset metadata updated successfully.");
          setTimeout(() => setSaveStatus("idle"), 2000);
        },
        onError: () => {
          setSaveStatus("idle");
          toast.error("Failed to update metadata.");
        },
      }
    );
  };

  // --- Drag & Drop actions ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAssetId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOverFolder = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setHoveredFolderId(folderId);
  };

  const handleDragLeaveFolder = (e: React.DragEvent) => {
    e.preventDefault();
    setHoveredFolderId(null);
  };

  const handleDropOnFolder = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setHoveredFolderId(null);
    const assetId = e.dataTransfer.getData("text/plain") || draggedAssetId;
    if (assetId) {
      // Relocate the dragged media item
      toast.promise(
        bulkUpdateMutation.mutateAsync({
          ids: [assetId],
          action: "move",
          targetFolderId: targetFolderId,
        }),
        {
          loading: "Relocating asset...",
          success: "Asset moved successfully.",
          error: "Failed to relocate asset.",
        }
      );
    }
    setDraggedAssetId(null);
  };

  // --- File Upload handler ---
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.promise(
        uploadMutation.mutateAsync({ file, folderId: activeFolderId }),
        {
          loading: `Uploading ${file.name}...`,
          success: "Asset uploaded and indexed successfully.",
          error: "Failed to upload asset.",
        }
      );
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      toast.promise(
        uploadMutation.mutateAsync({ file, folderId: activeFolderId }),
        {
          loading: `Uploading ${file.name}...`,
          success: "Asset uploaded and indexed successfully.",
          error: "Failed to upload asset.",
        }
      );
    }
  };

  // --- Multi Selection Toggles ---
  const handleToggleSelect = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === rawMedia.length) {
      setSelectedIds(new Set());
    } else {
      const all = new Set((rawMedia as MediaItem[]).map((m) => m.id));
      setSelectedIds(all);
    }
  };

  // --- Bulk Actions Execute ---
  const handleBulkMove = (targetFolderId: string | null) => {
    const ids = Array.from(selectedIds);
    setBulkMoveModal(null);
    toast.promise(
      bulkUpdateMutation.mutateAsync({
        ids,
        action: "move",
        targetFolderId,
      }),
      {
        loading: `Relocating ${ids.length} assets...`,
        success: "Assets relocated successfully.",
        error: "Failed to move assets.",
      }
    );
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (confirm(`Are you absolutely sure you want to delete these ${ids.length} assets permanently? This cannot be undone.`)) {
      toast.promise(
        bulkUpdateMutation.mutateAsync({
          ids,
          action: "delete",
        }),
        {
          loading: `Deleting ${ids.length} assets...`,
          success: "Assets deleted successfully.",
          error: "Failed to delete assets.",
        }
      );
      setSelectedIds(new Set());
      if (selectedAssetId && ids.includes(selectedAssetId)) {
        setSelectedAssetId(null);
      }
    }
  };

  // --- Single asset deletion ---
  const handleDeleteAsset = (id: string, filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}" permanently?`)) {
      toast.promise(
        deleteMutation.mutateAsync(id),
        {
          loading: "Deleting asset...",
          success: "Asset deleted successfully.",
          error: "Failed to delete asset.",
        }
      );
      if (selectedAssetId === id) {
        setSelectedAssetId(null);
      }
    }
  };

  // --- Folder Actions ---
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    createFolderMutation.mutate(
      {
        name: newFolderName,
        parentId: newFolderParentId,
      },
      {
        onSuccess: () => {
          setIsNewFolderOpen(false);
          setNewFolderName("");
          toast.success("Folder created successfully.");
        },
        onError: () => {
          toast.error("Failed to create folder.");
        },
      }
    );
  };

  const handleRenameFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFolderModal || !renameFolderName.trim()) return;

    updateFolderMutation.mutate(
      {
        id: renameFolderModal.id,
        name: renameFolderName,
      },
      {
        onSuccess: () => {
          setRenameFolderModal(null);
          setRenameFolderName("");
          toast.success("Folder renamed successfully.");
        },
        onError: () => {
          toast.error("Failed to rename folder.");
        },
      }
    );
  };

  const handleDeleteFolderSubmit = () => {
    if (!deleteFolderModal) return;

    toast.promise(
      deleteFolderMutation.mutateAsync({
        id: deleteFolderModal.id,
        mode: deleteFolderMode,
      }),
      {
        loading: "Deleting folder...",
        success: "Folder deleted successfully.",
        error: (err) => err.message || "Failed to delete folder. It may not be empty.",
      }
    );

    // If deleting active folder, go back to root
    if (activeFolderId === deleteFolderModal.id) {
      setActiveFolderId(null);
    }
    setDeleteFolderModal(null);
  };

  // --- Toggle expand tree node ---
  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // --- Copy link handler ---
  const copyAssetUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Public asset URL copied to clipboard!");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // --- Render Hierarchical Folder Tree Node ---
  const renderFolderNode = (node: FolderNode, depth = 0) => {
    const isExpanded = !!expandedFolders[node.id];
    const isSelected = activeFolderId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isDragOver = hoveredFolderId === node.id;

    return (
      <div key={node.id} className="space-y-0.5 select-none">
        <div
          onDragOver={(e) => handleDragOverFolder(e, node.id)}
          onDragLeave={handleDragLeaveFolder}
          onDrop={(e) => handleDropOnFolder(e, node.id)}
          onClick={() => {
            setActiveFolderId(node.id);
            setSelectedIds(new Set());
          }}
          className={cn(
            "group flex items-center justify-between py-1.5 px-3 rounded-[3px] text-[13px] transition-all cursor-pointer",
            isSelected 
              ? "bg-accent/15 text-accent-bright font-medium" 
              : "text-ink-inverse hover:bg-white/5",
            isDragOver && "border border-dashed border-accent-bright bg-accent-dim/20 scale-[1.01]"
          )}
          style={{ paddingLeft: `${Math.max(12, depth * 16)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={(e) => toggleFolderExpand(node.id, e)}
              className="size-4 flex items-center justify-center text-ink-faint hover:text-white rounded-[2px]"
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />
              ) : (
                <div className="size-1 bg-white/20 rounded-full" />
              )}
            </button>
            {isSelected ? (
              <FolderOpen className="size-3.5 text-accent-bright" />
            ) : (
              <Folder className="size-3.5 text-accent" />
            )}
            <span className="truncate pr-2">{node.name}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title="Add nested folder"
              onClick={(e) => {
                e.stopPropagation();
                setNewFolderParentId(node.id);
                setIsNewFolderOpen(true);
              }}
              className="size-4 flex items-center justify-center rounded-[2px] hover:bg-white/10 text-white/50 hover:text-white"
            >
              <FolderPlus className="size-3" />
            </button>
            <button
              title="Rename folder"
              onClick={(e) => {
                e.stopPropagation();
                setRenameFolderModal({ isOpen: true, id: node.id, name: node.name });
                setRenameFolderName(node.name);
              }}
              className="size-4 flex items-center justify-center rounded-[2px] hover:bg-white/10 text-white/50 hover:text-white"
            >
              <Edit2 className="size-3" />
            </button>
            <button
              title="Delete folder"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteFolderModal({ isOpen: true, id: node.id, name: node.name });
              }}
              className="size-4 flex items-center justify-center rounded-[2px] hover:bg-white/10 text-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleGlobalDrop}
      className="h-[calc(100vh-8.5rem)] flex border border-border bg-paper rounded-sm overflow-hidden animate-in fade-in duration-500 noise-overlay relative"
    >
      {/* ──────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR: Relational Folder Navigation Tree
          ────────────────────────────────────────────────────────────── */}
      <aside className="w-64 flex flex-col bg-sidebar text-ink-inverse border-r border-border select-none z-10 shrink-0">
        {/* Navigation header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-ink-faint/60">Asset Manager</span>
          </div>
          <button
            title="Create root folder"
            onClick={() => {
              setNewFolderParentId(null);
              setIsNewFolderOpen(true);
            }}
            className="p-1 rounded-[3px] hover:bg-white/5 text-ink-faint hover:text-white transition-colors"
          >
            <FolderPlus className="size-4" />
          </button>
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3 custom-scrollbar">
          {/* Default List nodes */}
          <div className="space-y-0.5">
            <div
              onDragOver={(e) => handleDragOverFolder(e, null)}
              onDragLeave={handleDragLeaveFolder}
              onDrop={(e) => handleDropOnFolder(e, null)}
              onClick={() => {
                setActiveFolderId(null);
                setSelectedIds(new Set());
              }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-[3px] text-[13px] font-semibold cursor-pointer transition-all",
                activeFolderId === null 
                  ? "bg-accent/15 text-accent-bright" 
                  : "text-ink-inverse hover:bg-white/5"
              )}
            >
              <Sparkles className="size-4 text-accent-bright" />
              <span>All Assets</span>
            </div>
          </div>

          <div className="pt-2 border-t border-sidebar-border/30">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold tracking-widest text-ink-faint/40 uppercase">Directories</span>
            </div>

            <div className="space-y-0.5">
              {folderTree.length === 0 ? (
                <div className="px-3 py-4 text-xs font-light italic text-ink-faint/30 text-center">
                  No folders created
                </div>
              ) : (
                folderTree.map((roots) => renderFolderNode(roots))
              )}
            </div>
          </div>
        </div>

        {/* Storage stats */}
        <div className="p-4 bg-sidebar-mid border-t border-sidebar-border text-[11px] font-mono text-ink-faint/50 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Info className="size-3 text-accent" />
            <span>Pro Workspace Quota</span>
          </div>
          <div className="w-full bg-sidebar-border h-1 rounded-full overflow-hidden mt-1.5">
            <div className="bg-accent h-full w-[24%]" />
          </div>
          <div className="flex justify-between mt-1 text-[9px]">
            <span>120.4 MB Used</span>
            <span>500 MB limit</span>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────────
          2. CENTER PANEL: Asset Workspace & Breadcrumb Bar
          ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-canvas z-10 relative">
        {/* Header bar */}
        <header className="h-14 border-b border-border bg-paper flex items-center justify-between px-6 shrink-0">
          {/* Left: Breadcrumbs chain */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[10px] text-ink-faint">/</span>}
                <button
                  onClick={() => {
                    setActiveFolderId(crumb.id);
                    setSelectedIds(new Set());
                  }}
                  className={cn(
                    "text-[13px] font-medium transition-colors hover:text-accent truncate max-w-[120px]",
                    idx === breadcrumbs.length - 1 ? "text-ink font-semibold" : "text-ink-muted"
                  )}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-faint" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filenames..."
                className="pl-8 h-8 text-xs w-48 bg-canvas border-border text-ink rounded-[3px] focus-visible:ring-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-ink-faint hover:text-ink flex items-center justify-center"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Grid vs List Switcher */}
            <div className="flex items-center bg-canvas border border-border rounded-[3px] p-0.5 h-8">
              <button
                onClick={() => changeView("grid")}
                className={cn(
                  "size-7 flex items-center justify-center rounded-[2px] transition-all",
                  view === "grid" ? "bg-paper text-ink shadow-sm" : "text-ink-faint hover:text-ink"
                )}
                title="Grid view"
              >
                <Grid className="size-3.5" />
              </button>
              <button
                onClick={() => changeView("list")}
                className={cn(
                  "size-7 flex items-center justify-center rounded-[2px] transition-all",
                  view === "list" ? "bg-paper text-ink shadow-sm" : "text-ink-faint hover:text-ink"
                )}
                title="List view"
              >
                <ListIcon className="size-3.5" />
              </button>
            </div>

            {/* Upload Button */}
            <Button asChild className="h-8 px-4 text-[10px] font-mono tracking-widest font-semibold uppercase rounded-[3px] bg-accent text-white hover:bg-accent/90 shrink-0">
              <label className="cursor-pointer flex items-center">
                <Plus className="size-3.5 mr-1.5" />
                Upload File
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </Button>
          </div>
        </header>

        {/* Content canvas */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          {isMediaLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-[3px] bg-border/40" />
              ))}
            </div>
          ) : rawMedia.length === 0 ? (
            /* Empty State onboarding cards */
            <div className="relative flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-sm bg-paper graph-bg opacity-90 overflow-hidden min-h-[360px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col items-center max-w-sm text-center px-4">
                <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center mb-4 bg-canvas text-ink-faint">
                  <UploadCloud className="size-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-ink mb-1 font-display">
                  {activeFolderId ? "Folder is empty" : "Populate Media Library"}
                </h3>
                <p className="text-xs text-ink-muted mb-6 leading-relaxed font-light">
                  {activeFolderId 
                    ? "Drag files onto this page, or upload files directly into this directory."
                    : "Establish a robust media assets pool. Upload covers, documents, or create subfolders."}
                </p>
                <Button asChild className="h-9 px-6 text-[10px] font-mono tracking-wider uppercase font-semibold rounded-[3px]">
                  <label className="cursor-pointer flex items-center">
                    <Plus className="size-4 mr-1.5" />
                    Select files
                    <input type="file" className="hidden" onChange={handleUpload} />
                  </label>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Select All Controller */}
              <div className="flex items-center gap-2 mb-4 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={selectedIds.size === rawMedia.length && rawMedia.length > 0}
                  onChange={handleSelectAll}
                  className="rounded-[2px] border-border text-accent focus:ring-accent size-3.5"
                />
                <span className="font-mono text-[10px]">Select All Items ({rawMedia.length})</span>
              </div>

              {view === "grid" ? (
                /* Grid view cards */
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {(rawMedia as MediaItem[]).map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const isInspectorActive = selectedAssetId === item.id;
                    const isImage = item.mimeType?.startsWith("image/");

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onClick={() => setSelectedAssetId(item.id)}
                        className={cn(
                          "group relative bg-paper border rounded-[3px] overflow-hidden transition-all duration-300 cursor-pointer select-none",
                          isInspectorActive 
                            ? "border-accent ring-1 ring-accent bg-accent/5 scale-[1.01]" 
                            : "border-border hover:border-accent hover:shadow-sm"
                        )}
                      >
                        {/* Thumbnail View */}
                        <div className="aspect-square bg-canvas flex items-center justify-center relative overflow-hidden">
                          {isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.url}
                              alt={item.alt || item.filename}
                              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          ) : item.mimeType === "application/pdf" ? (
                            <FileText className="size-10 text-destructive/70" />
                          ) : (
                            <FileCode className="size-10 text-accent/70" />
                          )}

                          {/* Top checkbox */}
                          <div className="absolute top-2 left-2 z-20">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleToggleSelect(item.id, e)}
                              className="rounded-[2px] border-border text-accent focus:ring-accent size-3.5"
                            />
                          </div>

                          {/* Inline indicators */}
                          {item.folderRelation && (
                            <div className="absolute bottom-1 right-1 bg-ink/75 backdrop-blur-[2px] text-[8px] font-mono text-white rounded-[2px] px-1.5 py-0.5">
                              {item.folderRelation.name}
                            </div>
                          )}
                        </div>

                        {/* Detail text */}
                        <div className="p-3 border-t border-border/50 bg-paper/60 group-hover:bg-paper transition-colors">
                          <p className="text-[11px] font-semibold text-ink truncate mb-0.5">
                            {item.title || item.filename}
                          </p>
                          <p className="text-[9px] font-mono text-ink-faint uppercase tracking-tight flex justify-between">
                            <span>{formatBytes(item.size)}</span>
                            <span>{item.mimeType?.split("/")[1] || "FILE"}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View layout */
                <div className="border border-border rounded-[3px] bg-paper overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-canvas border-b border-border text-ink-muted uppercase text-[9px] font-mono tracking-wider">
                        <th className="p-3 w-8"></th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Dimensions</th>
                        <th className="p-3">Folder</th>
                        <th className="p-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rawMedia as MediaItem[]).map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        const isInspectorActive = selectedAssetId === item.id;
                        const isImage = item.mimeType?.startsWith("image/");

                        return (
                          <tr
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={() => setSelectedAssetId(item.id)}
                            className={cn(
                              "border-b border-border/40 hover:bg-canvas/40 cursor-pointer transition-colors",
                              isInspectorActive && "bg-accent/5"
                            )}
                          >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleToggleSelect(item.id, e)}
                                className="rounded-[2px] border-border text-accent focus:ring-accent size-3.5"
                              />
                            </td>
                            <td className="p-3 font-medium text-ink min-w-[200px]">
                              <div className="flex items-center gap-2.5">
                                <div className="size-7 bg-canvas border border-border flex items-center justify-center shrink-0 overflow-hidden rounded-[2px]">
                                  {isImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.url} alt="" className="size-full object-cover" />
                                  ) : (
                                    <ImageIcon className="size-3 text-ink-faint" />
                                  )}
                                </div>
                                <span className="truncate max-w-sm">{item.filename}</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-[10px] text-ink-muted uppercase">{item.mimeType?.split("/")[1] || "FILE"}</td>
                            <td className="p-3 text-ink-muted">{formatBytes(item.size)}</td>
                            <td className="p-3 font-mono text-[10px] text-ink-muted">
                              {item.width && item.height ? `${item.width} × ${item.height}` : "—"}
                            </td>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 bg-canvas border border-border rounded-[2px] font-mono text-[9px] text-ink-muted uppercase">
                                {item.folderRelation?.name || "root"}
                              </span>
                            </td>
                            <td className="p-3 text-ink-muted font-mono text-[10px]">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sliding floating action bar for bulk operations */}
        {selectedIds.size > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-sidebar text-white shadow-xl rounded-full px-6 py-3 flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom duration-300 border border-white/10">
            <span className="text-xs font-mono text-ink-faint">
              <span className="text-accent-bright font-bold mr-1">{selectedIds.size}</span> items selected
            </span>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-3">
              {/* Move selected */}
              <button
                onClick={() => setBulkMoveModal({ isOpen: true, targetFolderId: null })}
                className="text-xs flex items-center gap-1.5 hover:text-accent-bright transition-colors px-2 py-1"
              >
                <FolderOpen className="size-3.5" />
                <span>Move to Folder</span>
              </button>
              
              {/* Download selected */}
              <button
                onClick={() => {
                  Array.from(selectedIds).forEach((id) => {
                    const asset = (rawMedia as MediaItem[]).find((m) => m.id === id);
                    if (asset) {
                      window.open(asset.url, "_blank");
                    }
                  });
                  toast.success(`Opening ${selectedIds.size} downloads...`);
                }}
                className="text-xs flex items-center gap-1.5 hover:text-accent-bright transition-colors px-2 py-1"
              >
                <Download className="size-3.5" />
                <span>Download</span>
              </button>

              {/* Delete selected */}
              <button
                onClick={handleBulkDelete}
                className="text-xs flex items-center gap-1.5 hover:text-destructive transition-colors px-2 py-1 font-semibold"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </button>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[10px] font-mono uppercase font-bold text-ink-faint hover:text-white transition-colors"
            >
              Deselect
            </button>
          </div>
        )}
      </main>

      {/* ──────────────────────────────────────────────────────────────
          3. RIGHT PANEL: Detailed Asset Inspector Drawer
          ────────────────────────────────────────────────────────────── */}
      {selectedAsset && (
        <aside className="w-80 border-l border-border bg-paper shrink-0 flex flex-col animate-in slide-in-from-right duration-300 z-25 relative">
          {/* Inspector Header */}
          <div className="h-14 border-b border-border px-5 flex items-center justify-between shrink-0">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">Asset details</span>
            <button
              onClick={() => setSelectedAssetId(null)}
              className="p-1 rounded-[3px] hover:bg-canvas text-ink-faint hover:text-ink transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Inspector content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {/* Visual Preview card */}
            <div className="aspect-video bg-canvas border border-border rounded-[3px] flex items-center justify-center overflow-hidden relative group shadow-sm bg-grid">
              {selectedAsset.mimeType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedAsset.url}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              ) : selectedAsset.mimeType === "application/pdf" ? (
                <FileText className="size-12 text-destructive" />
              ) : (
                <FileCode className="size-12 text-accent" />
              )}
              
              <a
                href={selectedAsset.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Expand raw asset"
                className="absolute right-2 top-2 p-1.5 bg-paper/90 backdrop-blur-[2px] border border-border text-ink rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="size-3" />
              </a>
            </div>

            {/* Quick URL Copy */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyAssetUrl(selectedAsset.url)}
                className="flex-1 h-8 rounded-[3px] text-xs font-mono font-medium"
              >
                <Copy className="size-3 mr-1.5" />
                Copy Public URL
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteAsset(selectedAsset.id, selectedAsset.filename)}
                className="h-8 size-8 p-0 rounded-[3px]"
                title="Delete asset permanently"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            {/* Metadata Inline Editor form */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <h4 className="text-[10px] font-mono tracking-widest font-bold uppercase text-ink-faint">Metadata Metadata</h4>
              
              <div className="space-y-3.5">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-ink-muted">Asset Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveMetadata}
                    placeholder="Provide a visual descriptive title..."
                    className="h-8 text-xs bg-paper border-border focus-visible:ring-accent rounded-[3px]"
                  />
                </div>

                {/* Alt Text */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-ink-muted">Alt Text (Accessibility)</label>
                  <Input
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    onBlur={handleSaveMetadata}
                    placeholder="Describe for screen readers..."
                    className="h-8 text-xs bg-paper border-border focus-visible:ring-accent rounded-[3px]"
                  />
                </div>

                {/* Caption */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-ink-muted">Visual Caption</label>
                  <textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    onBlur={handleSaveMetadata}
                    placeholder="Rendered caption text..."
                    rows={2}
                    className="w-full p-2 text-xs bg-paper border border-border focus:outline-none focus:ring-1 focus:ring-accent rounded-[3px] resize-none"
                  />
                </div>

                {/* Saving Indicator */}
                {saveStatus !== "idle" && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent">
                    {saveStatus === "saving" ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        <span>Saving metadata changes...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3 text-success" />
                        <span className="text-success font-semibold">Changes saved successfully!</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-3.5 pt-4 border-t border-border/50">
              <h4 className="text-[10px] font-mono tracking-widest font-bold uppercase text-ink-faint">Asset specifications</h4>
              
              <div className="space-y-2 text-xs font-mono text-ink-muted">
                <div className="flex justify-between">
                  <span>File Name</span>
                  <span className="text-ink truncate max-w-[160px]" title={selectedAsset.filename}>
                    {selectedAsset.filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mime Type</span>
                  <span className="text-ink text-[10px] uppercase">
                    {selectedAsset.mimeType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>File Size</span>
                  <span className="text-ink">
                    {formatBytes(selectedAsset.size)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dimensions</span>
                  <span className="text-ink">
                    {selectedAsset.width && selectedAsset.height 
                      ? `${selectedAsset.width} × ${selectedAsset.height} px` 
                      : "Non-visual"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Uploaded At</span>
                  <span className="text-ink text-[10px]">
                    {new Date(selectedAsset.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Usage Tracking System widget */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h4 className="text-[10px] font-mono tracking-widest font-bold uppercase text-ink-faint">Usage Tracking</h4>
              
              {isUsagesLoading ? (
                <div className="flex items-center gap-2 text-xs text-ink-faint font-mono">
                  <Loader2 className="size-3.5 animate-spin text-accent" />
                  <span>Scanning dynamic workspace records...</span>
                </div>
              ) : assetUsages.length === 0 ? (
                <div className="flex items-start gap-2 bg-success/5 border border-success/20 p-3 rounded-[3px]">
                  <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-success">
                    <p className="font-semibold">Unreferenced Asset</p>
                    <p className="font-light text-[10px] mt-0.5">This file is not used in any collection entry. Completely safe to delete.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-warning/5 border border-warning/20 p-3 rounded-[3px]">
                    <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed text-warning">
                      <p className="font-semibold">Used in {assetUsages.length} entry/entries</p>
                      <p className="font-light text-[10px] mt-0.5">Deleting this item will break content references in live schemas.</p>
                    </div>
                  </div>
                  <div className="space-y-1 pl-2.5 border-l border-border/60">
                    {assetUsages.map((usage, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                        <CornerDownRight className="size-3 text-ink-faint shrink-0" />
                        <span className="font-mono text-[9px] uppercase px-1 bg-canvas border border-border rounded-[2px]">
                          {usage.type}
                        </span>
                        <span className="truncate max-w-[130px] text-ink font-medium" title={usage.name}>
                          {usage.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ──────────────────────────────────────────────────────────────
          MODAL DIALOGS (Custom Glassmorphic Overlay Components)
          ────────────────────────────────────────────────────────────── */}
      
      {/* 1. Create New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-paper border border-border shadow-xl rounded-sm w-96 max-w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold font-display text-ink flex items-center gap-2">
                <FolderPlus className="size-5 text-accent" />
                Create New Folder
              </h3>
              <button
                onClick={() => setIsNewFolderOpen(false)}
                className="size-6 hover:bg-canvas rounded-[3px] text-ink-faint hover:text-ink flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-ink-muted">Folder Name</label>
                <Input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. covers, Covers, Brand Assets"
                  className="h-9 text-xs focus-visible:ring-accent rounded-[3px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="rounded-[3px] h-8 text-xs font-mono"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newFolderName.trim()}
                  className="rounded-[3px] h-8 text-xs bg-accent text-white hover:bg-accent/90 font-mono font-bold"
                >
                  Create Folder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Delete Folder Modal with Deletion Rule Toggles */}
      {deleteFolderModal && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-paper border border-border shadow-xl rounded-sm w-[420px] max-w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold font-display text-destructive flex items-center gap-2">
                <AlertTriangle className="size-5" />
                Delete Folder: &quot;{deleteFolderModal.name}&quot;
              </h3>
              <button
                onClick={() => setDeleteFolderModal(null)}
                className="size-6 hover:bg-canvas rounded-[3px] text-ink-faint hover:text-ink flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-ink-muted font-light leading-relaxed">
                Choose what to do with the assets and subdirectories contained inside this directory. You will never orphan assets.
              </p>

              {/* Policy choice list */}
              <div className="space-y-3">
                {/* Mode B: Relocate contents */}
                <label className="flex items-start gap-3 p-3 border border-border/80 rounded-[3px] cursor-pointer hover:bg-canvas/45 transition-colors">
                  <input
                    type="radio"
                    name="delete-mode"
                    checked={deleteFolderMode === "move"}
                    onChange={() => setDeleteFolderMode("move")}
                    className="mt-0.5 text-accent focus:ring-accent size-3.5"
                  />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-ink">Relocate contents (Default Option B)</p>
                    <p className="text-ink-faint text-[10px] leading-relaxed">
                      Moves all files and child subfolders to this folder&apos;s parent folder (or the root library) so nothing is lost.
                    </p>
                  </div>
                </label>

                {/* Mode A: Fails if not empty */}
                <label className="flex items-start gap-3 p-3 border border-border/80 rounded-[3px] cursor-pointer hover:bg-canvas/45 transition-colors">
                  <input
                    type="radio"
                    name="delete-mode"
                    checked={deleteFolderMode === "empty"}
                    onChange={() => setDeleteFolderMode("empty")}
                    className="mt-0.5 text-accent focus:ring-accent size-3.5"
                  />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-ink">Delete only when empty (Option A)</p>
                    <p className="text-ink-faint text-[10px] leading-relaxed">
                      Strict policy. The deletion is rejected if this folder currently contains any media assets or subfolders.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteFolderModal(null)}
                  className="rounded-[3px] h-8 text-xs font-mono"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDeleteFolderSubmit}
                  className="rounded-[3px] h-8 text-xs bg-destructive text-white hover:bg-destructive/90 font-mono font-bold"
                >
                  Delete Directory
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Rename Folder Modal */}
      {renameFolderModal && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-paper border border-border shadow-xl rounded-sm w-96 max-w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold font-display text-ink flex items-center gap-2">
                <Edit2 className="size-4 text-accent" />
                Rename Directory
              </h3>
              <button
                onClick={() => setRenameFolderModal(null)}
                className="size-6 hover:bg-canvas rounded-[3px] text-ink-faint hover:text-ink flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRenameFolder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-ink-muted">Directory Name</label>
                <Input
                  autoFocus
                  value={renameFolderName}
                  onChange={(e) => setRenameFolderName(e.target.value)}
                  className="h-9 text-xs focus-visible:ring-accent rounded-[3px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRenameFolderModal(null)}
                  className="rounded-[3px] h-8 text-xs font-mono"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!renameFolderName.trim()}
                  className="rounded-[3px] h-8 text-xs bg-accent text-white hover:bg-accent/90 font-mono font-bold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Bulk Move Folder Relocation Modal */}
      {bulkMoveModal && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-paper border border-border shadow-xl rounded-sm w-[440px] max-w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold font-display text-ink flex items-center gap-2">
                <FolderOpen className="size-5 text-accent" />
                Move Selected Assets ({selectedIds.size})
              </h3>
              <button
                onClick={() => setBulkMoveModal(null)}
                className="size-6 hover:bg-canvas rounded-[3px] text-ink-faint hover:text-ink flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-ink-muted leading-relaxed font-light">
                Select a target directory to relocate the {selectedIds.size} chosen media assets.
              </p>

              {/* Target folder list */}
              <div className="max-h-60 overflow-y-auto border border-border rounded-[3px] p-2 bg-canvas space-y-0.5 custom-scrollbar text-xs">
                {/* Root level option */}
                <div
                  onClick={() => handleBulkMove(null)}
                  className="px-3 py-2 hover:bg-accent/15 hover:text-accent font-medium rounded-[3px] cursor-pointer flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="size-3.5 text-accent" />
                  <span>Media Root Directory</span>
                </div>
                
                {((rawFolders || []) as MediaFolderItem[]).map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleBulkMove(f.id)}
                    className="px-3 py-2 hover:bg-accent/15 hover:text-accent font-medium rounded-[3px] cursor-pointer flex items-center gap-2 transition-colors pl-6 border-l border-border/60"
                  >
                    <Folder className="size-3.5 text-accent" />
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkMoveModal(null)}
                  className="rounded-[3px] h-8 text-xs font-mono"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
