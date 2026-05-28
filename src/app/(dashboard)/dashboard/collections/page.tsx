"use client";

import React from "react";
import { 
  Layers, 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileText, 
  ArrowRight, 
  Clock,
  Sparkles,
  Code,
  Database,
  Check
} from "lucide-react";
import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  updatedAt: string;
  _count?: {
    entries: number;
  };
}

const CollectionCard = ({ collection }: { collection: Collection }) => (
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
          {collection.name}
        </h3>
        <p className="text-[10px] font-mono text-ink-faint uppercase tracking-[0.2em]">
          {collection.slug}
        </p>
      </div>
      
      <p className="text-xs text-ink-muted leading-relaxed mb-10 line-clamp-2 font-light">
        {collection.description || "No description provided for this collection."}
      </p>

      <div className="mt-auto flex items-center gap-6 pt-8 border-t border-border">
        <div className="flex items-center gap-2.5 text-ink-muted">
          <FileText className="size-3.5 opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            {collection._count?.entries || 0} Entries
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-ink-faint">
          <Clock className="size-3.5 opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            {new Date(collection.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </CardContent>
    
    <div className="grid grid-cols-2 border-t border-border bg-canvas/30">
      <Link 
        href={`/dashboard/collections/${collection.id}`}
        className="flex items-center justify-center py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted hover:bg-canvas hover:text-ink border-r border-border transition-all no-underline"
      >
        Configure
      </Link>
      <Link 
        href={`/dashboard/collections/${collection.id}/entries`}
        className="flex items-center justify-center py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all no-underline"
      >
        View Entries <ArrowRight className="size-3 ml-2.5" />
      </Link>
    </div>
  </Card>
);

const CollectionsEmptyState = () => {
  const [activeFields, setActiveFields] = React.useState<string[]>(["title", "content"]);

  const fields = [
    { id: "title", label: "Title", type: "Text", description: "Standard string input" },
    { id: "content", label: "Body Content", type: "Rich Text", description: "HTML/Markdown editor" },
    { id: "image", label: "Featured Image", type: "Asset", description: "File/Image upload" },
    { id: "published", label: "Published State", type: "Boolean", description: "True/false switch" },
    { id: "author", label: "Author", type: "Relation", description: "Link to another collection" },
  ];

  const toggleField = (id: string) => {
    setActiveFields(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id) 
        : [...prev, id]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Left panel: Info & Guidance */}
      <div className="lg:col-span-7 flex flex-col justify-between p-8 bg-paper border border-border rounded-sm shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent opacity-40 pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="size-3" />
            Zero-Config Content Blueprints
          </div>
          
          <div className="space-y-3">
            <h2 className="font-display text-3xl font-semibold text-ink leading-tight">
              Design Your <em className="italic text-accent not-italic">Headless Blueprint</em>
            </h2>
            <p className="text-ink-muted text-sm font-light leading-relaxed max-w-xl">
              Collections define the structural schema for your contents. Once you define custom fields like text inputs, relation links, or images, FlowCMS automatically builds clean editing panels for your writers and serves highly optimized JSON endpoints for your apps.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-faint">
              1. Toggle fields to simulate your schema:
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {fields.map((f) => {
                const isActive = activeFields.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleField(f.id)}
                    className={`px-4 py-2.5 rounded-sm border text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                      isActive 
                        ? "bg-accent border-accent text-white shadow-md shadow-accent/20 scale-105" 
                        : "bg-canvas border-border text-ink-muted hover:border-accent/40 hover:text-ink"
                    }`}
                  >
                    {isActive ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5 opacity-55" />
                    )}
                    {f.label}
                    <span className={`text-[9px] lowercase font-normal opacity-60 ${isActive ? "text-white/80" : "text-ink-faint"}`}>
                      ({f.type})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-10 border-t border-border mt-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Database className="size-4 text-ink-faint shrink-0" />
            <span className="text-xs text-ink-muted font-light">
              {"We'll auto-provision the GraphQL/REST API instantly."}
            </span>
          </div>
          <Button asChild className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-xl self-start">
            <Link href="/dashboard/collections/new">
              <Plus className="size-4 mr-2" />
              Create First Collection
            </Link>
          </Button>
        </div>
      </div>

      {/* Right panel: Live API Schema Preview */}
      <div className="lg:col-span-5 flex flex-col bg-[#0b0f19] border border-[#1e293b] rounded-sm p-6 shadow-2xl relative overflow-hidden text-[11px] leading-relaxed">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Mock HTTP Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              GET
            </span>
            <span className="font-mono text-white/50 tracking-tight truncate max-w-[200px] sm:max-w-xs">
              /api/v1/content/blog-posts
            </span>
          </div>
          <Code className="size-4 text-white/20 shrink-0" />
        </div>

        {/* JSON Sandbox Area */}
        <div className="font-mono flex-1 space-y-1 overflow-x-auto min-h-[220px]">
          <div className="text-white/35 mb-2">{/* REST API Response Payload */}</div>
          <div className="text-white/60">{"{"}</div>
          <div className="pl-4 space-y-1 border-l border-white/5 ml-2">
            <div className="flex">
              <span className="text-indigo-400">{"\"id\""}</span>
              <span className="text-white/60">:</span>{" "}
              <span className="text-emerald-400">{"\"ent_9f8d3a1\""}</span>
              <span className="text-white/60">,</span>
            </div>
            <div className="flex">
              <span className="text-indigo-400">{"\"slug\""}</span>
              <span className="text-white/60">:</span>{" "}
              <span className="text-emerald-400">{"\"modern-headless-cms\""}</span>
              <span className="text-white/60">,</span>
            </div>
            
            {activeFields.includes("title") && (
              <div className="flex animate-in slide-in-from-left-2 duration-300">
                <span className="text-indigo-400">{"\"title\""}</span>
                <span className="text-white/60">:</span>{" "}
                <span className="text-emerald-400">{"\"Unlocking Anti-Gravity Speed\""}</span>
                <span className="text-white/60">,</span>
              </div>
            )}
            
            {activeFields.includes("content") && (
              <div className="flex animate-in slide-in-from-left-2 duration-300">
                <span className="text-indigo-400">{"\"content\""}</span>
                <span className="text-white/60">:</span>{" "}
                <span className="text-emerald-400">{"\"<h1>Next-Gen Content Delivery...</h1>\""}</span>
                <span className="text-white/60">,</span>
              </div>
            )}
            
            {activeFields.includes("image") && (
              <div className="animate-in slide-in-from-left-2 duration-300">
                <span className="text-indigo-400">{"\"featuredImage\""}</span>
                <span className="text-white/60">: {"{"}</span>
                <div className="pl-4 space-y-0.5">
                  <div>
                    <span className="text-indigo-400">{"\"url\""}</span>
                    <span className="text-white/60">:</span>{" "}
                    <span className="text-emerald-400">{"\"https://flowcms.io/uploads/speed.png\""}</span>
                    <span className="text-white/60">,</span>
                  </div>
                  <div>
                    <span className="text-indigo-400">{"\"size\""}</span>
                    <span className="text-white/60">:</span>{" "}
                    <span className="text-amber-400">48201</span>
                  </div>
                </div>
                <span className="text-white/60">{"}"},</span>
              </div>
            )}
            
            {activeFields.includes("published") && (
              <div className="flex animate-in slide-in-from-left-2 duration-300">
                <span className="text-indigo-400">{"\"published\""}</span>
                <span className="text-white/60">:</span>{" "}
                <span className="text-purple-400">true</span>
                <span className="text-white/60">,</span>
              </div>
            )}
            
            {activeFields.includes("author") && (
              <div className="animate-in slide-in-from-left-2 duration-300">
                <span className="text-indigo-400">{"\"author\""}</span>
                <span className="text-white/60">: {"{"}</span>
                <div className="pl-4 space-y-0.5">
                  <div>
                    <span className="text-indigo-400">{"\"name\""}</span>
                    <span className="text-white/60">:</span>{" "}
                    <span className="text-emerald-400">{"\"Jane Smith\""}</span>
                    <span className="text-white/60">,</span>
                  </div>
                  <div>
                    <span className="text-indigo-400">{"\"role\""}</span>
                    <span className="text-white/60">:</span>{" "}
                    <span className="text-emerald-400">{"\"Lead Editor\""}</span>
                  </div>
                </div>
                <span className="text-white/60">{"}"}</span>
              </div>
            )}
          </div>
          <div className="text-white/60">{"}"}</div>
        </div>
        
        {/* Footer info inside code preview */}
        <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-[9px] font-mono text-white/30">
          <span>STATUS: 200 OK</span>
          <span>SPEED: 4ms</span>
        </div>
      </div>
    </div>
  );
};

export default function CollectionsPage() {
  const { data, isLoading } = useCollections();
  const collections = data as Collection[];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="space-y-1.5">
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            The <em className="italic text-accent not-italic">Collections</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Define and manage the structured schemas for your content library.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
            <Input 
              placeholder="Search collections..."
              className="pl-10 h-10 bg-paper border-border text-sm w-64 rounded-sm"
            />
          </div>
          <Button asChild className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-md">
            <Link href="/dashboard/collections/new">
              <Plus className="size-3.5 mr-2" />
              Create Collection
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
      ) : collections?.length === 0 ? (
        <CollectionsEmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections?.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
