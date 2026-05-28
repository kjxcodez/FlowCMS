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
  ExternalLink,
  UploadCloud,
  Sparkles
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
  mimeType: string;
}

export default function MediaPage() {
  const { data, isLoading } = useMedia();
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const media = data as MediaItem[];
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

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
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center py-32 bg-paper border rounded-sm overflow-hidden transition-all duration-500",
            isDragging 
              ? "border-accent bg-accent/5 shadow-2xl scale-[1.01] border-dashed border-2" 
              : "border-border border-dashed border-2 hover:border-accent/40"
          )}
        >
          <div className="absolute inset-0 graph-bg opacity-[0.05]" />
          
          {/* Subtle design accents */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-md text-center px-6">
            <div className={cn(
              "w-20 h-20 rounded-full border flex items-center justify-center mb-6 transition-all duration-500",
              isDragging 
                ? "bg-accent border-accent text-white scale-110 shadow-lg shadow-accent/25 animate-bounce" 
                : "bg-canvas border-border text-ink-faint hover:text-accent hover:border-accent/40"
            )}>
              {isDragging ? (
                <UploadCloud className="size-8 animate-pulse" />
              ) : (
                <ImageIcon className="size-8 opacity-60" />
              )}
            </div>

            <div className="space-y-2 mb-8">
              <h3 className="font-display text-2xl font-semibold text-ink flex items-center justify-center gap-2">
                {isDragging ? "Drop to upload" : "Populate your media library"}
              </h3>
              <p className="text-ink-muted text-sm font-light leading-relaxed">
                {isDragging 
                  ? "Release your files to start the lightning fast indexing process." 
                  : "Drag and drop raw images or documents anywhere inside this card, or upload them directly from your computer."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button asChild className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg w-full sm:w-auto">
                <label className="cursor-pointer">
                  <Plus className="size-4 mr-2" />
                  Select Files
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              </Button>
            </div>
            
            <div className="mt-8 flex items-center gap-2 text-[10px] font-mono text-ink-faint uppercase tracking-wider">
              <Sparkles className="size-3 text-accent animate-pulse" />
              <span>Supports PNG, JPEG, SVG & PDF up to 10MB</span>
            </div>
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
                {item.mimeType?.startsWith("image/") ? (
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
                    {(item.size / 1024).toFixed(1)} KB • {item.mimeType ? item.mimeType.split("/")[1] : "FILE"}
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
