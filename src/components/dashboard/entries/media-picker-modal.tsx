"use client";

import React, { useState } from "react";
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

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  selectedUrl?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedUrl,
}: MediaPickerModalProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Mock media data
  const mediaFiles = [
    { id: "1", name: "hero-banner.jpg", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800", type: "image" },
    { id: "2", name: "product-demo.mp4", url: "#", type: "video" },
    { id: "3", name: "profile-shot.png", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400", type: "image" },
    { id: "4", name: "logo-dark.svg", url: "#", type: "image" },
    { id: "5", name: "background-texture.webp", url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800", type: "image" },
  ];

  const filteredMedia = mediaFiles.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

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
                  <Button size="sm" className="h-9 gap-2 text-[10px] font-bold uppercase tracking-widest px-4">
                    <Upload className="size-3.5" />
                    Upload
                  </Button>
               </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-canvas custom-scrollbar">
              {view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => onSelect(file.url)}
                      className={cn(
                        "group relative aspect-square bg-paper border border-border rounded-sm overflow-hidden cursor-pointer transition-all hover:border-accent hover:shadow-lg",
                        selectedUrl === file.url && "border-accent ring-2 ring-accent/20"
                      )}
                    >
                      {file.type === "image" ? (
                        <img src={file.url} alt={file.name} className="size-full object-cover grayscale group-hover:grayscale-0 transition-all" />
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
                   {filteredMedia.map(file => (
                     <div 
                       key={file.id}
                       onClick={() => onSelect(file.url)}
                       className={cn(
                         "flex items-center gap-4 p-3 bg-paper border border-border rounded-sm cursor-pointer transition-all hover:border-accent hover:bg-accent/5",
                         selectedUrl === file.url && "border-accent bg-accent/5"
                       )}
                     >
                        <div className="size-10 bg-canvas rounded-sm flex items-center justify-center shrink-0">
                           {file.type === "image" ? (
                             <img src={file.url} alt={file.name} className="size-8 object-cover grayscale rounded-[1px]" />
                           ) : (
                             <File className="size-5 text-accent/40" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-bold text-ink truncate">{file.name}</p>
                           <p className="text-[10px] font-mono text-ink-faint uppercase">1.2 MB • {file.type}</p>
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
