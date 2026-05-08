"use client";

import React from "react";
import { 
  Plus, 
  Search, 
  ArrowLeft,
  ChevronRight,
  MoreVertical,
  Filter,
  CheckCircle2,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEntries } from "@/hooks/use-entries";
import { useContentType } from "@/hooks/use-content-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  published: boolean;
  updatedAt: string;
  content: Record<string, unknown>;
  author?: {
    name: string;
  };
}

export default function EntriesListPage() {
  const { id } = useParams<{ id: string }>();
  const { data: contentType } = useContentType(id);
  const { data, isLoading } = useEntries(id);
  const entries = data as Entry[];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="flex items-start gap-6">
          <Button asChild variant="outline" size="icon" className="size-11 rounded-full border-border bg-paper hover:bg-canvas transition-all shadow-sm">
            <Link href="/dashboard/content-types">
              <ArrowLeft className="size-4 text-ink-muted" />
            </Link>
          </Button>
          <div className="space-y-1.5">
             <div className="flex items-center gap-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-faint mb-2">
              <Link href="/dashboard/content-types" className="hover:text-ink transition-colors no-underline">Content Types</Link>
              <ChevronRight className="size-3 opacity-30" />
              <span className="text-accent">{contentType?.title || "Loading..."}</span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-ink">
              Content <em className="italic text-accent not-italic">Entries</em>
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
          <Button variant="outline" size="icon" className="size-10 border-border bg-paper rounded-sm text-ink-muted hover:text-ink">
            <Filter className="size-4" />
          </Button>
          <Button asChild className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-md">
            <Link href={`/dashboard/content-types/${id}/entries/new`}>
              <Plus className="size-3.5 mr-2" />
              New Entry
            </Link>
          </Button>
        </div>
      </header>

      {/* Table / List */}
      <Card className="bg-paper border-border rounded-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas border-b border-border">
                <th className="px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Entry Title</th>
                <th className="px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Status</th>
                <th className="px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Author</th>
                <th className="px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Updated At</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan={5} className="px-8 py-6">
                      <Skeleton className="h-5 w-full rounded-sm opacity-50" />
                    </td>
                  </tr>
                ))
              ) : entries?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="size-12 rounded-full bg-canvas flex items-center justify-center border border-border opacity-20">
                         <Plus className="size-6 text-ink-faint" />
                      </div>
                      <p className="text-ink-muted text-sm font-light">No entries found for this content type.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries?.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-canvas transition-colors">
                    <td className="px-8 py-5">
                      <Link href={`/dashboard/content-types/${id}/entries/${entry.id}`} className="block group/link no-underline">
                        <p className="text-[13px] font-semibold text-ink group-hover/link:text-accent transition-colors">{(entry.content?.title as string) || "Untitled Entry"}</p>
                        <p className="text-[9px] font-mono text-ink-faint uppercase tracking-tighter mt-0.5">{entry.id}</p>
                      </Link>
                    </td>
                    <td className="px-8 py-5">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "px-2.5 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-[0.15em] border-none",
                          entry.published ? "bg-success/10 text-success" : "bg-ink-muted/10 text-ink-muted"
                        )}
                      >
                        {entry.published ? "Live" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[11px] font-medium text-ink-muted flex items-center gap-2">
                        <div className="size-5 rounded-full bg-canvas border border-border flex items-center justify-center text-[8px] font-bold">
                          {(entry.author?.name || "S")[0]}
                        </div>
                        {entry.author?.name || "System"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-mono text-ink-faint uppercase tracking-widest">
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Button variant="ghost" size="icon-sm" className="text-ink-faint hover:text-ink">
                        <MoreVertical className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
