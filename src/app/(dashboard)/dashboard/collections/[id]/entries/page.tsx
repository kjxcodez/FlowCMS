"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  FileText,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useEntries } from "@/hooks/use-entries";
import { useCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CollectionEntriesPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { data: collection } = useCollection(id as string);
  const { data: entries, isLoading } = useEntries(id as string);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/collections"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink-muted hover:text-ink hover:border-border-strong transition-all"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-ink-faint mb-1">
              <Link href="/dashboard/collections" className="hover:text-ink-muted">Collections</Link>
              <ChevronRight className="size-3" />
              <span className="text-accent">{collection?.name || "Loading..."}</span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-ink italic uppercase tracking-tight">
              View <span className="text-accent not-italic">Entries</span>
            </h1>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
            <Input 
              placeholder="Filter entries..."
              className="pl-10 h-10 bg-paper border-border text-sm w-64 rounded-sm"
            />
          </div>
          <Button variant="outline" className="h-10 px-4 rounded-sm border-border text-ink-muted">
            <Filter className="size-3.5 mr-2" />
            Filter
          </Button>
          <Button asChild className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-md">
            <Link href={`/dashboard/collections/${id}/entries/new`}>
              <Plus className="size-3.5 mr-2" />
              New Entry
            </Link>
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-sm" />
          ))}
        </div>
      ) : entries?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-paper border border-border border-dashed rounded-sm graph-bg relative overflow-hidden">
          <div className="absolute inset-0 graph-bg opacity-[0.05]" />
          <div className="relative z-10 flex flex-col items-center">
            <FileText className="size-12 text-ink-faint mb-5 opacity-20" />
            <h3 className="font-display text-xl font-medium text-ink mb-2">No entries found</h3>
            <p className="text-ink-muted text-sm mb-9 font-light text-center max-w-xs">
              This collection is empty. Start by creating your first entry.
            </p>
            <Button asChild className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg">
              <Link href={`/dashboard/collections/${id}/entries/new`}>
                <Plus className="size-4 mr-2" />
                Create First Entry
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-border-strong rounded-sm overflow-hidden bg-paper shadow-sm">
          <Table>
            <TableHeader className="bg-canvas/50">
              <TableRow className="border-border">
                <TableHead className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink-faint py-5">Status</TableHead>
                <TableHead className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink-faint py-5">Entry Title</TableHead>
                <TableHead className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink-faint py-5">Updated</TableHead>
                <TableHead className="text-right py-5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries?.map((entry: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <TableRow key={entry.id} className="group hover:bg-canvas/40 transition-colors border-border">
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-none",
                        entry.status === "PUBLISHED" 
                          ? "bg-success/10 text-success border-success/20" 
                          : "bg-ink-faint/10 text-ink-faint border-border"
                      )}
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                        {entry.data.title || entry.slug || entry.id.substring(0, 8)}
                      </span>
                      <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider mt-0.5">
                        {entry.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted font-light">
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" asChild className="text-ink-faint hover:text-ink">
                            <Link href={`/dashboard/collections/${id}/entries/${entry.id}`}>
                                <ExternalLink className="size-3.5" />
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="text-ink-faint hover:text-ink">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-paper border-border">
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/collections/${id}/entries/${entry.id}`)}>
                                    Edit Entry
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    Archive Entry
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return inputs.filter(Boolean).join(" ");
}
