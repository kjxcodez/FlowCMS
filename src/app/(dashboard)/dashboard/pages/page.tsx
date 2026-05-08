"use client";

import React from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  ExternalLink,
  Clock,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { usePages } from "@/hooks/use-pages";
import { APP_CONFIG } from "@/config/app";

interface Page {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
}

export default function PagesListPage() {
  const { data, isLoading } = usePages();
  const pages = data as Page[];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--ink)] mb-2">
            Site <em>Pages</em>
          </h1>
          <p className="text-[var(--ink-muted)] text-sm max-w-md">
            Manage your high-level site structure and layout-based landing pages.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-faint)]" />
            <input 
              type="text" 
              placeholder="Search pages..."
              className="pl-10 pr-4 h-10 bg-[var(--paper)] border border-[var(--border)] rounded text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)] transition-all w-64"
            />
          </div>
          <Link 
            href="/dashboard/pages/new"
            className="flex items-center gap-2 px-4 h-10 bg-[var(--sidebar)] text-white rounded text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Page
          </Link>
        </div>
      </header>

      {/* Pages Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-[var(--paper)] border border-[var(--border)] rounded animate-pulse" />
          ))}
        </div>
      ) : pages?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[var(--paper)] border border-[var(--border)] border-dashed rounded">
          <FileText className="w-12 h-12 text-[var(--ink-faint)] mb-4" />
          <h3 className="font-display text-xl font-medium text-[var(--ink)] mb-2">No pages yet</h3>
          <p className="text-[var(--ink-muted)] text-sm mb-8">Landing pages, About, Contact - build them all with blocks.</p>
          <Link 
            href="/dashboard/pages/new"
            className="flex items-center gap-2 px-6 h-11 bg-[var(--accent)] text-white rounded text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create First Page
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages?.map((page) => (
            <div key={page.id} className="group bg-[var(--paper)] border border-[var(--border)] rounded overflow-hidden hover:border-[var(--accent)] transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider",
                    page.published ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--ink-muted)]/10 text-[var(--ink-muted)]"
                  )}>
                    {page.published ? "Live" : "Draft"}
                  </div>
                  <button className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="font-display text-xl font-semibold text-[var(--ink)] mb-1">
                  {page.title}
                </h3>
                <p className="text-[10px] font-mono text-[var(--ink-faint)] uppercase tracking-widest mb-4">
                  /{page.slug}
                </p>
                
                <div className="flex items-center gap-3 text-[var(--ink-muted)]">
                   <Clock className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-bold uppercase tracking-wider">
                     Modified {new Date(page.updatedAt).toLocaleDateString()}
                   </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 border-t border-[var(--border)] bg-[var(--canvas)]/50">
                <Link 
                  href={`/dashboard/pages/${page.id}`}
                  className="flex items-center justify-center py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] border-r border-[var(--border)] transition-all"
                >
                  Edit Blocks
                </Link>
                <a 
                  href={`${APP_CONFIG.apiUrl}/v1/pages/${page.slug}`}
                  target="_blank"
                  className="flex items-center justify-center py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-all"
                >
                  API <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(" ");
}
