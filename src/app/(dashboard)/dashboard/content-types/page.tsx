"use client";

import React from "react";
import { 
  Layers, 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileText, 
  ArrowRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useContentTypes } from "@/hooks/use-content-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentType {
  id: string;
  title: string;
  slug: string;
  description?: string;
  updatedAt: string;
  _count?: {
    entries: number;
  };
}

const ContentTypeCard = ({ type }: { type: ContentType }) => (
  <Card className="group bg-paper border-border rounded-sm overflow-hidden hover:border-accent transition-all">
    <CardContent className="p-0">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded bg-canvas flex items-center justify-center text-ink-muted group-hover:text-accent transition-colors">
            <Layers className="size-5" />
          </div>
          <Button variant="ghost" size="icon-sm" className="text-ink-faint hover:text-ink">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
        
        <h3 className="font-display text-xl font-semibold text-ink mb-1">
          {type.title}
        </h3>
        <p className="text-[10px] font-mono text-ink-faint uppercase tracking-widest mb-4">
          {type.slug}
        </p>
        
        <p className="text-xs text-ink-muted leading-relaxed mb-6 line-clamp-2 font-light">
          {type.description || "No description provided for this content type."}
        </p>

        <div className="flex items-center gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <FileText className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {type._count?.entries || 0} Entries
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-faint">
            <Clock className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Updated {new Date(type.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 border-t border-border bg-canvas/50">
        <Link 
          href={`/dashboard/content-types/${type.id}`}
          className="flex items-center justify-center py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted hover:bg-canvas hover:text-ink border-r border-border transition-all no-underline"
        >
          Configure
        </Link>
        <Link 
          href={`/dashboard/content-types/${type.id}/entries`}
          className="flex items-center justify-center py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all no-underline"
        >
          View Entries <ArrowRight className="size-3 ml-2" />
        </Link>
      </div>
    </CardContent>
  </Card>
);

export default function ContentTypesPage() {
  const { data, isLoading } = useContentTypes();
  const types = data as ContentType[];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            Content <em className="italic text-accent not-italic">Types</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Define and manage the structured schemas for your content library.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
            <Input 
              placeholder="Search types..."
              className="pl-10 h-10 bg-paper border-border text-sm w-64 rounded-sm"
            />
          </div>
          <Button asChild className="h-10 px-5 text-[11px] font-bold uppercase tracking-widest rounded-sm">
            <Link href="/dashboard/content-types/new">
              <Plus className="size-3.5 mr-2" />
              Create New Type
            </Link>
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-sm" />
          ))}
        </div>
      ) : types?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-paper border border-border border-dashed rounded-sm">
          <Layers className="size-12 text-ink-faint mb-5 opacity-20" />
          <h3 className="font-display text-xl font-medium text-ink mb-2">No content types found</h3>
          <p className="text-ink-muted text-sm mb-9 font-light">Start by creating your first content schema.</p>
          <Button asChild className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm">
            <Link href="/dashboard/content-types/new">
              <Plus className="size-4 mr-2" />
              Create First Type
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types?.map((type) => (
            <ContentTypeCard key={type.id} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}
