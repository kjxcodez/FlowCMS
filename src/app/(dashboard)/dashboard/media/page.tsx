"use client";

import React, { useState } from "react";
import { 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Grid, 
  List, 
  Copy, 
  Trash2,
  ExternalLink
} from "lucide-react";
import { useMedia, useUploadMedia, useDeleteMedia } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  title: string;
  size: number;
  type: string;
}

export default function MediaPage() {
  const { data, isLoading } = useMedia();
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const media = data as MediaItem[];
  const [view, setView] = useState<"grid" | "list">("grid");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // Add toast here later
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--ink)] mb-2">
            Media <em>Library</em>
          </h1>
          <p className="text-[var(--ink-muted)] text-sm max-w-md">
            Manage your digital assets, images, and documents in one central hub.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)]" />
            <input 
              type="text" 
              placeholder="Search assets..."
              className="pl-10 pr-4 h-10 bg-[var(--paper)] border border-[var(--border)] rounded text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)] transition-all w-64"
            />
          </div>
          <div className="flex items-center bg-[var(--canvas)] border border-[var(--border)] rounded px-1 py-1">
            <button 
              onClick={() => setView("grid")}
              className={cn("p-1.5 rounded-sm transition-all", view === "grid" ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-faint)]")}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView("list")}
              className={cn("p-1.5 rounded-sm transition-all", view === "list" ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-faint)]")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <label className="flex items-center gap-2 px-4 h-10 bg-[var(--sidebar)] text-white rounded text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Upload Asset
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-[var(--paper)] border border-[var(--border)] rounded animate-pulse" />
          ))}
        </div>
      ) : media?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-[var(--paper)] border border-[var(--border)] border-dashed rounded">
          <ImageIcon className="w-12 h-12 text-[var(--ink-faint)] mb-4" />
          <h3 className="font-display text-xl font-medium text-[var(--ink)] mb-2">No assets found</h3>
          <p className="text-[var(--ink-muted)] text-sm mb-8">Upload images or documents to use them in your content.</p>
          <label className="flex items-center gap-2 px-6 h-11 bg-[var(--accent)] text-white rounded text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer">
            <Plus className="w-4 h-4" />
            Upload First Asset
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      ) : (
        <div className={cn(
          view === "grid" 
            ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" 
            : "space-y-2"
        )}>
          {media?.map((item) => (
            <div key={item.id} className={cn(
              "group relative bg-[var(--paper)] border border-[var(--border)] rounded overflow-hidden hover:border-[var(--accent)] transition-all",
              view === "list" ? "flex items-center px-4 py-2 gap-4" : ""
            )}>
              {/* Preview */}
              <div className={cn(
                "bg-[var(--canvas)] flex items-center justify-center overflow-hidden",
                view === "grid" ? "aspect-square" : "w-12 h-12 rounded"
              )}>
                {item.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[var(--ink-faint)]" />
                )}
              </div>

              {/* Info */}
              {view === "grid" ? (
                <div className="p-3">
                  <p className="text-[10px] font-semibold text-[var(--ink)] truncate mb-1">{item.title}</p>
                  <p className="text-[9px] font-mono text-[var(--ink-faint)] uppercase tracking-tight">
                    {(item.size / 1024).toFixed(1)} KB • {item.type.split("/")[1]}
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--ink)] truncate">{item.title}</p>
                  <p className="text-[10px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">
                    {item.url}
                  </p>
                </div>
              )}

              {/* Overlay / Actions */}
              <div className={cn(
                "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2",
                view === "list" ? "relative bg-transparent opacity-100 flex-row ml-auto" : ""
              )}>
                <div className="flex gap-2">
                  <button 
                    onClick={() => copyUrl(item.url)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a 
                    href={item.url} 
                    target="_blank"
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    title="Open Original"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button 
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-2 bg-[var(--destructive)]/80 hover:bg-[var(--destructive)] text-white rounded-full transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
