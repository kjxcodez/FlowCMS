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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            Media <em className="italic text-accent not-italic">Library</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Manage your digital assets, images, and documents in one central hub.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
            <Input 
              placeholder="Search assets..."
              className="pl-10 h-10 bg-paper border-border text-sm w-64 rounded-sm"
            />
          </div>
          <div className="flex items-center bg-canvas border border-border rounded-sm px-1 py-1">
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => setView("grid")}
              className={cn("size-8 rounded-sm transition-all", view === "grid" ? "bg-paper text-ink shadow-sm" : "text-ink-faint")}
            >
              <Grid className="size-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => setView("list")}
              className={cn("size-8 rounded-sm transition-all", view === "list" ? "bg-paper text-ink shadow-sm" : "text-ink-faint")}
            >
              <List className="size-4" />
            </Button>
          </div>
          <Button asChild className="h-10 px-5 text-[11px] font-bold uppercase tracking-widest rounded-sm">
            <label className="cursor-pointer">
              <Plus className="size-3.5 mr-2" />
              Upload Asset
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="aspect-square rounded-sm" />
          ))}
        </div>
      ) : media?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-paper border border-border border-dashed rounded-sm graph-bg relative overflow-hidden">
           <div className="absolute inset-0 graph-bg opacity-[0.05]" />
           <div className="relative z-10 flex flex-col items-center">
            <ImageIcon className="size-12 text-ink-faint mb-5 opacity-20" />
            <h3 className="font-display text-xl font-medium text-ink mb-2">No assets found</h3>
            <p className="text-ink-muted text-sm mb-9 font-light">Upload images or documents to use them in your content.</p>
            <Button asChild className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg">
              <label className="cursor-pointer">
                <Plus className="size-4 mr-2" />
                Upload First Asset
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn(
          view === "grid" 
            ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" 
            : "space-y-2"
        )}>
          {media?.map((item) => (
            <div key={item.id} className={cn(
              "group relative bg-paper border border-border rounded-sm overflow-hidden hover:border-accent transition-all",
              view === "list" ? "flex items-center px-4 py-2 gap-4" : ""
            )}>
              {/* Preview */}
              <div className={cn(
                "bg-canvas flex items-center justify-center overflow-hidden transition-colors group-hover:bg-accent/5",
                view === "grid" ? "aspect-square" : "size-12 rounded-sm"
              )}>
                {item.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <ImageIcon className="size-6 text-ink-faint group-hover:text-accent transition-colors" />
                )}
              </div>

              {/* Info */}
              {view === "grid" ? (
                <div className="p-4 border-t border-border group-hover:border-accent/20 transition-colors">
                  <p className="text-[11px] font-semibold text-ink truncate mb-1">{item.title}</p>
                  <p className="text-[9px] font-mono text-ink-faint uppercase tracking-tighter">
                    {(item.size / 1024).toFixed(1)} KB • {item.type.split("/")[1]}
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{item.title}</p>
                  <p className="text-[10px] font-mono text-ink-faint uppercase tracking-widest mt-0.5">
                    {item.url}
                  </p>
                </div>
              )}

              {/* Overlay / Actions */}
              <div className={cn(
                "absolute inset-0 bg-sidebar/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2",
                view === "list" ? "relative bg-transparent backdrop-blur-none opacity-100 flex-row ml-auto h-auto w-auto p-0" : ""
              )}>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={() => copyUrl(item.url)}
                    className="size-8 bg-white/10 hover:bg-white text-white hover:text-sidebar rounded-full transition-all"
                    title="Copy URL"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button 
                    asChild
                    variant="ghost" 
                    size="icon-sm"
                    className="size-8 bg-white/10 hover:bg-white text-white hover:text-sidebar rounded-full transition-all"
                  >
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="size-8 bg-destructive/80 hover:bg-destructive text-white rounded-full transition-all"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
