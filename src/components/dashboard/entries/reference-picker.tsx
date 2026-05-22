"use client";

import React, { useState } from "react";
import { 
  X, 
  Search, 
  Link as LinkIcon, 
  ChevronRight,
  Check,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntries } from "@/hooks/use-entries";
import { cn } from "@/lib/utils";

interface ReferencePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string, title: string) => void;
  selectedId?: string;
  collectionName?: string;
}

export function ReferencePicker({
  isOpen,
  onClose,
  onSelect,
  selectedId,
  collectionName = "Entries",
}: ReferencePickerProps) {
  const [search, setSearch] = useState("");
  const { data: entries, isLoading } = useEntries();

  const filteredEntries = (entries || []).filter((e: any) =>  // eslint-disable-line @typescript-eslint/no-explicit-any
    (e.data?.title || e.slug || "").toLowerCase().includes(search.toLowerCase()) || 
    e.slug.toLowerCase().includes(search.toLowerCase())
  );

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
            className="bg-paper border border-border-strong shadow-2xl rounded-sm w-full max-w-2xl h-[500px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-paper/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-sm">
                  <LinkIcon className="size-4 text-accent" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink uppercase tracking-wider">Select Reference</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-canvas">
                <X className="size-5" />
              </Button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 border-b border-border bg-canvas/30">
               <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-faint" />
                  <Input 
                    placeholder={`Search entries in ${collectionName}...`} 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 bg-paper border-border rounded-sm text-xs"
                  />
               </div>
            </div>

             {/* Content */}
             <div className="flex-1 overflow-auto p-2 bg-canvas custom-scrollbar">
                <div className="space-y-1">
                   {isLoading ? (
                     <div className="py-20 text-center animate-pulse opacity-30">
                        <p className="text-xs font-mono uppercase tracking-[0.3em]">Syncing Entries...</p>
                     </div>
                   ) : filteredEntries.map((entry: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                     <div 
                       key={entry.id}
                       onClick={() => onSelect(entry.id, entry.data?.title || entry.slug)}
                       className={cn(
                         "group flex items-center gap-4 p-3 bg-paper border border-transparent rounded-sm cursor-pointer transition-all hover:border-accent hover:bg-accent/5",
                         selectedId === entry.id && "border-accent bg-accent/5"
                       )}
                     >
                        <div className="size-9 bg-canvas border border-border rounded-sm flex items-center justify-center shrink-0 group-hover:border-accent/20 transition-colors">
                           <FileText className="size-4 text-ink-faint group-hover:text-accent transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-ink truncate">{entry.data?.title || entry.slug}</p>
                           <p className="text-[10px] font-mono text-ink-faint uppercase tracking-tighter">/{entry.slug} • {entry.status}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           {selectedId === entry.id ? (
                             <div className="size-6 bg-accent rounded-full flex items-center justify-center text-paper">
                                <Check className="size-3.5" />
                             </div>
                           ) : (
                             <ChevronRight className="size-4 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                           )}
                        </div>
                     </div>
                   ))}
                   {!isLoading && filteredEntries.length === 0 && (
                    <div className="py-20 text-center space-y-3 opacity-30">
                       <Search className="size-8 mx-auto" />
                       <p className="text-xs font-mono uppercase tracking-widest">No entries found</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-paper flex items-center justify-between text-[10px] font-mono text-ink-faint uppercase tracking-widest">
               <span>{filteredEntries.length} entries available</span>
               <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-[10px] font-bold uppercase tracking-widest">
                  Cancel
               </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
