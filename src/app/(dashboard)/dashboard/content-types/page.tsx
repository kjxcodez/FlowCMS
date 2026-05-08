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
  <Card className="group bg-paper border-border rounded-sm overflow-hidden hover:border-accent hover:shadow-xl transition-all duration-300 flex flex-col">
    <CardContent className="p-8 flex-1 flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div className="w-12 h-12 rounded-sm bg-canvas border border-border flex items-center justify-center text-ink-muted group-hover:text-accent group-hover:border-accent transition-all">
          <Layers className="size-5" />
        </div>
        <Button variant="ghost" size="icon-sm" className="text-ink-faint hover:text-ink transition-colors">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
      
      <div className="space-y-2 mb-8">
        <h3 className="font-display text-2xl font-semibold text-ink group-hover:text-accent transition-colors leading-tight">
          {type.title}
        </h3>
        <p className="text-[10px] font-mono text-ink-faint uppercase tracking-[0.2em]">
          {type.slug}
        </p>
      </div>
      
      <p className="text-xs text-ink-muted leading-relaxed mb-10 line-clamp-2 font-light">
        {type.description || "No description provided for this content type."}
      </p>

      <div className="mt-auto flex items-center gap-6 pt-8 border-t border-border">
        <div className="flex items-center gap-2.5 text-ink-muted">
          <FileText className="size-3.5 opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            {type._count?.entries || 0} Entries
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-ink-faint">
          <Clock className="size-3.5 opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            {new Date(type.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </CardContent>
    
    <div className="grid grid-cols-2 border-t border-border bg-canvas/30">
      <Link 
        href={`/dashboard/content-types/${type.id}`}
        className="flex items-center justify-center py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted hover:bg-canvas hover:text-ink border-r border-border transition-all no-underline"
      >
        Configure
      </Link>
      <Link 
        href={`/dashboard/content-types/${type.id}/entries`}
        className="flex items-center justify-center py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all no-underline"
      >
        View Entries <ArrowRight className="size-3 ml-2.5" />
      </Link>
    </div>
  </Card>
);

export default function ContentTypesPage() {
  const { data, isLoading } = useContentTypes();
  const types = data as ContentType[];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="space-y-1.5">
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            Content <em className="italic text-accent not-italic">Types</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Define and manage the structured schemas for your content library.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
            <Input 
              placeholder="Search types..."
              className="pl-10 h-10 bg-paper border-border text-sm w-64 rounded-sm"
            />
          </div>
          <Button asChild className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-md">
            <Link href="/dashboard/content-types/new">
              <Plus className="size-3.5 mr-2" />
              Create New Type
            </Link>
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-sm" />
          ))}
        </div>
      ) : types?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-paper border border-border border-dashed rounded-sm graph-bg relative overflow-hidden">
          <div className="absolute inset-0 graph-bg opacity-[0.05]" />
          <div className="relative z-10 flex flex-col items-center">
            <Layers className="size-12 text-ink-faint mb-5 opacity-20" />
            <h3 className="font-display text-xl font-medium text-ink mb-2">No content types found</h3>
            <p className="text-ink-muted text-sm mb-9 font-light">Start by creating your first content schema.</p>
            <Button asChild className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg">
              <Link href="/dashboard/content-types/new">
                <Plus className="size-4 mr-2" />
                Create First Type
              </Link>
            </Button>
          </div>
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
