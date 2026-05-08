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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="space-y-1.5">
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            Site <em className="italic text-accent not-italic">Pages</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Manage your high-level site structure and layout-based landing pages.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
            <Input 
              placeholder="Search pages..."
              className="pl-10 h-10 bg-paper border-border text-sm w-64 rounded-sm"
            />
          </div>
          <Button asChild className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-md">
            <Link href="/dashboard/pages/new">
              <Plus className="size-3.5 mr-2" />
              Create New Page
            </Link>
          </Button>
        </div>
      </header>

      {/* Pages Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-56 rounded-sm" />
          ))}
        </div>
      ) : pages?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-paper border border-border border-dashed rounded-sm graph-bg relative overflow-hidden">
           <div className="absolute inset-0 graph-bg opacity-[0.05]" />
           <div className="relative z-10 flex flex-col items-center">
            <FileText className="size-12 text-ink-faint mb-5 opacity-20" />
            <h3 className="font-display text-xl font-medium text-ink mb-2">No pages yet</h3>
            <p className="text-ink-muted text-sm mb-9 font-light">Landing pages, About, Contact - build them all with blocks.</p>
            <Button asChild className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg">
              <Link href="/dashboard/pages/new">
                <Plus className="size-4 mr-2" />
                Create First Page
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pages?.map((page) => (
            <Card key={page.id} className="group bg-paper border-border rounded-sm overflow-hidden hover:border-accent hover:shadow-xl transition-all duration-300 flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "px-2.5 py-1 rounded-sm font-bold text-[9px] uppercase tracking-[0.15em] border-none transition-colors",
                      page.published ? "bg-success/10 text-success" : "bg-ink-muted/10 text-ink-muted"
                    )}
                  >
                    {page.published ? "Live" : "Draft"}
                  </Badge>
                  <Button variant="ghost" size="icon-sm" className="text-ink-faint hover:text-ink transition-colors">
                    <MoreVertical className="size-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 mb-8">
                  <h3 className="font-display text-2xl font-semibold text-ink group-hover:text-accent transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-[10px] font-mono text-ink-faint uppercase tracking-[0.2em]">
                    /{page.slug}
                  </p>
                </div>
                
                <div className="mt-auto flex items-center gap-2.5 text-ink-muted">
                   <Clock className="size-3.5 opacity-50" />
                   <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
                     Modified {new Date(page.updatedAt).toLocaleDateString()}
                   </span>
                </div>
              </CardContent>
              
              <div className="grid grid-cols-2 border-t border-border bg-canvas/30">
                <Link 
                  href={`/dashboard/pages/${page.id}`}
                  className="flex items-center justify-center py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted hover:bg-canvas hover:text-ink border-r border-border transition-all no-underline"
                >
                  Edit Blocks
                </Link>
                <a 
                  href={`${APP_CONFIG.apiUrl}/v1/pages/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted hover:bg-canvas hover:text-ink transition-all no-underline"
                >
                  API <ExternalLink className="size-3 ml-2.5" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
