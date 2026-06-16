"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  Search, 
  Upload, 
  Image as ImageIcon, 
  File, 
  Check,
  Grid,
  List
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMedia, useUploadMedia } from "@/hooks/use-media";
import { toast } from "sonner";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  selectedUrl?: string;
}

interface PickerFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedUrl,
}: MediaPickerModalProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: media = [], isLoading } = useMedia();
  const uploadMutation = useUploadMedia();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const res = await uploadMutation.mutateAsync({ file });
      if (res?.data?.url) {
        onSelect(res.data.url);
        toast.success("Media uploaded and selected!");
      } else {
        toast.success("Media uploaded successfully!");
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err?.message || "Failed to upload media");
    }
  };

  const filteredMedia: PickerFile[] = (media || []).map((m: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: m.id,
    name: m.filename,
    url: m.url,
    type: m.mimeType?.startsWith("image") ? "image" : "video",
    size: m.size,
  })).filter((m: PickerFile) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-paper/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-paper border border-border-strong shadow-2xl rounded-sm w-full max-w-4xl h-[600px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-paper/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-sm">
                  <ImageIcon className="size-4 text-accent" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink uppercase tracking-wider">Media Library</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-canvas">
                <X className="size-5" />
              </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 px-6 py-3 border-b border-border bg-canvas/30">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-faint" />
                  <Input 
                    placeholder="Search media..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-paper border-border rounded-sm text-xs"
                  />
               </div>
               <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex bg-paper border border-border rounded-sm p-0.5">
                     <button 
                       onClick={() => setView("grid")}
                       className={cn("p-1.5 rounded-sm transition-colors", view === "grid" ? "bg-accent/10 text-accent" : "text-ink-faint hover:text-ink")}
                     >
                        <Grid className="size-3.5" />
                     </button>
                     <button 
                       onClick={() => setView("list")}
                       className={cn("p-1.5 rounded-sm transition-colors", view === "list" ? "bg-accent/10 text-accent" : "text-ink-faint hover:text-ink")}
                     >
                        <List className="size-3.5" />
                     </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept="image/*,video/*"
                  />
                  <Button 
                    size="sm" 
                    disabled={uploadMutation.isPending}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 gap-2 text-[10px] font-bold uppercase tracking-widest px-4"
                  >
                    <Upload className="size-3.5" />
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
               </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-canvas custom-scrollbar">
              {isLoading ? (
                <div className="size-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="size-full flex flex-col items-center justify-center text-ink-muted">
                  <ImageIcon className="size-12 text-ink-faint mb-4" />
                  <p className="text-sm font-medium">No media files found</p>
                  <p className="text-xs text-ink-faint mt-1">Upload files to get started</p>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((file: PickerFile) => (
                    <div 
                      key={file.id}
                      onClick={() => onSelect(file.url)}
                      className={cn(
                        "group relative aspect-square bg-paper border border-border rounded-sm overflow-hidden cursor-pointer transition-all hover:border-accent hover:shadow-lg",
                        selectedUrl === file.url && "border-accent ring-2 ring-accent/20"
                      )}
                    >
                      {file.type === "image" ? (
                        <div className="relative size-full">
                          <Image 
                            src={file.url} 
                            alt={file.name} 
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover grayscale group-hover:grayscale-0 transition-all" 
                          />
                        </div>
                      ) : (
                        <div className="size-full flex items-center justify-center bg-accent/5">
                           <File className="size-8 text-accent/20 group-hover:text-accent transition-colors" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                         <p className="text-[10px] font-mono text-white truncate">{file.name}</p>
                      </div>

                      {selectedUrl === file.url && (
                        <div className="absolute top-2 right-2 size-5 bg-accent rounded-full flex items-center justify-center text-paper shadow-lg">
                           <Check className="size-3 font-bold" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                   {filteredMedia.map((file: PickerFile) => (
                     <div 
                       key={file.id}
                       onClick={() => onSelect(file.url)}
                       className={cn(
                         "flex items-center gap-4 p-3 bg-paper border border-border rounded-sm cursor-pointer transition-all hover:border-accent hover:bg-accent/5",
                         selectedUrl === file.url && "border-accent bg-accent/5"
                       )}
                     >
                        <div className="size-10 bg-canvas rounded-sm flex items-center justify-center shrink-0 overflow-hidden relative">
                           {file.type === "image" ? (
                             <Image src={file.url} alt={file.name} fill className="object-cover grayscale rounded-[1px]" />
                           ) : (
                             <File className="size-5 text-accent/40" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-ink truncate">{file.name}</p>
                           <p className="text-[10px] font-mono text-ink-faint uppercase">
                             {formatSize(file.size)} • {file.type}
                           </p>
                        </div>
                        {selectedUrl === file.url && <Check className="size-4 text-accent" />}
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-paper flex items-center justify-between">
               <p className="text-[10px] font-mono text-ink-faint uppercase tracking-widest">
                 {filteredMedia.length} files found
               </p>
               <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={onClose} className="h-9 text-[10px] font-bold uppercase tracking-widest px-6">
                    Cancel
                  </Button>
                  <Button size="sm" disabled={!selectedUrl} onClick={onClose} className="h-9 text-[10px] font-bold uppercase tracking-widest px-8">
                    Select
                  </Button>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
