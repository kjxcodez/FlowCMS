"use client";

import React, { useEffect, useState } from "react";
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "cmdk";
import { 
  Search, 
  Plus, 
  Layout, 
  FileText, 
  Settings, 
  HelpCircle,
  ArrowRight,
  Database,
  Globe,
  User,
  LogOut
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCollections } from "@/hooks/use-collections";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: collections } = useCollections();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center border-b border-border px-4 py-3 bg-paper/50">
        <Search className="mr-3 h-4 w-4 shrink-0 text-ink-faint" />
        <CommandInput
          placeholder="Type a command or search..."
          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-ink-faint disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <CommandList className="max-h-[450px] overflow-y-auto overflow-x-hidden p-2 bg-paper custom-scrollbar">
        <CommandEmpty className="py-12 text-center">
          <div className="flex flex-col items-center gap-3 opacity-30">
            <HelpCircle className="size-8" />
            <p className="text-xs font-mono uppercase tracking-widest">No results found.</p>
          </div>
        </CommandEmpty>
        
        <CommandGroup heading="Quick Actions" className="px-2 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-faint">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/collections/new"))}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-ink-muted hover:bg-canvas hover:text-accent cursor-pointer transition-colors aria-selected:bg-canvas aria-selected:text-accent"
          >
            <Plus className="size-4" />
            <span>Create New Collection</span>
            <div className="ml-auto flex items-center gap-1 opacity-20">
              <kbd className="font-mono text-[10px]">C</kbd>
            </div>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/media"))}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-ink-muted hover:bg-canvas hover:text-accent cursor-pointer transition-colors aria-selected:bg-canvas aria-selected:text-accent"
          >
            <Database className="size-4" />
            <span>Manage Media Library</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator className="my-2 h-px bg-border" />
        
        {collections && collections.length > 0 && (
          <CommandGroup heading="Collections" className="px-2 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-faint">
            {collections.map((collection: any) => (
              <CommandItem
                key={collection.id}
                onSelect={() => runCommand(() => router.push(`/dashboard/collections/${collection.id}/entries`))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-ink-muted hover:bg-canvas hover:text-accent cursor-pointer transition-colors aria-selected:bg-canvas aria-selected:text-accent"
              >
                <Layout className="size-4" />
                <span>{collection.name}</span>
                <ArrowRight className="ml-auto size-3 opacity-20" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="my-2 h-px bg-border" />

        <CommandGroup heading="Settings" className="px-2 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-faint">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-ink-muted hover:bg-canvas hover:text-accent cursor-pointer transition-colors aria-selected:bg-canvas aria-selected:text-accent"
          >
            <Settings className="size-4" />
            <span>Workspace Settings</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings/api"))}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-ink-muted hover:bg-canvas hover:text-accent cursor-pointer transition-colors aria-selected:bg-canvas aria-selected:text-accent"
          >
            <Globe className="size-4" />
            <span>API & Keys</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-canvas/50 text-[10px] font-mono text-ink-faint uppercase tracking-widest">
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><kbd className="bg-paper border border-border px-1 rounded-sm text-[9px]">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-paper border border-border px-1 rounded-sm text-[9px]">↵</kbd> Select</span>
         </div>
         <span className="text-accent font-bold">Flow Palette v1</span>
      </div>
    </CommandDialog>
  );
}
