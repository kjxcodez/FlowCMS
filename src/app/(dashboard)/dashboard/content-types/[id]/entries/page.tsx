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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/content-types"
            className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
             <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--ink-faint)] mb-1">
              <Link href="/dashboard/content-types" className="hover:text-[var(--ink-muted)]">Content Types</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[var(--accent)]">{contentType?.title || "Loading..."}</span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-[var(--ink)]">
              Entries
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)]" />
            <input 
              type="text" 
              placeholder="Filter entries..."
              className="pl-10 pr-4 h-10 bg-[var(--paper)] border border-[var(--border)] rounded text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)] transition-all w-64"
            />
          </div>
          <button className="flex items-center justify-center w-10 h-10 border border-[var(--border)] rounded text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all">
            <Filter className="w-4 h-4" />
          </button>
          <Link 
            href={`/dashboard/content-types/${id}/entries/new`}
            className="flex items-center gap-2 px-4 h-10 bg-[var(--sidebar)] text-white rounded text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            New Entry
          </Link>
        </div>
      </header>

      {/* Table / List */}
      <div className="bg-[var(--paper)] border border-[var(--border)] rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--canvas)]">
              <th className="px-6 py-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">Entry Title</th>
              <th className="px-6 py-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">Status</th>
              <th className="px-6 py-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">Author</th>
              <th className="px-6 py-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">Updated At</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-8 h-12 bg-[var(--paper)]" />
                </tr>
              ))
            ) : entries?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-sm text-[var(--ink-muted)]">
                  No entries found for this content type.
                </td>
              </tr>
            ) : (
              entries?.map((entry) => (
                <tr key={entry.id} className="group hover:bg-[var(--canvas)] transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/content-types/${id}/entries/${entry.id}`} className="block">
                      <p className="text-sm font-semibold text-[var(--ink)]">{(entry.content?.title as string) || "Untitled Entry"}</p>
                      <p className="text-[10px] font-mono text-[var(--ink-faint)] uppercase tracking-wider">{entry.id}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {entry.published ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--ink-muted)]/10 text-[var(--ink-muted)] text-[10px] font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--ink-muted)]">
                    {entry.author?.name || "System"}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--ink-faint)] font-mono">
                    {new Date(entry.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
