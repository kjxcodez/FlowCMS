"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  ChevronRight,
  Globe,
  Lock,
  Eye,
  History,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useCreateEntry } from "@/hooks/use-entries";
import { useContentType } from "@/hooks/use-content-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
  slug: string;
  type: string;
  required?: boolean;
}

export default function NewEntryPage() {
  const { id: contentTypeId } = useParams() as { id: string };
  const router = useRouter();
  const { data: contentType } = useContentType(contentTypeId);
  const createMutation = useCreateEntry();
  
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [published, setPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize content with empty values based on schema
  useEffect(() => {
    if (contentType?.fields) {
      const initial: Record<string, unknown> = {};
      contentType.fields.forEach((f: Field) => {
        initial[f.slug] = f.type === "boolean" ? false : "";
      });
      setContent(initial);
    }
  }, [contentType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createMutation.mutateAsync({
        contentTypeId,
        content,
        published,
      });
      router.push(`/dashboard/content-types/${contentTypeId}/entries`);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const renderField = (field: Field) => {
    const value = (content[field.slug] as string) || "";
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
      setContent(prev => ({ ...prev, [field.slug]: e.target.value }));

    return (
      <div key={field.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block font-mono text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
            {field.name} {field.required && <span className="text-destructive">*</span>}
          </label>
          <span className="text-[9px] font-mono text-ink-faint uppercase tracking-widest">{field.type}</span>
        </div>
        
        {field.type === "text" && (
          <Input 
            value={value}
            onChange={onChange}
            className="bg-paper border-border rounded-sm h-11 focus:ring-1 focus:ring-accent/20 transition-all"
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        )}

        {field.type === "richtext" && (
          <textarea 
            value={value}
            onChange={onChange}
            rows={8}
            className="w-full bg-paper border border-border rounded-sm px-4 py-3 text-sm text-ink outline-none focus:border-accent transition-all resize-none leading-relaxed"
            placeholder={`Write ${field.name.toLowerCase()} content...`}
          />
        )}

        {field.type === "number" && (
          <Input 
            type="number" 
            value={value}
            onChange={onChange}
            className="bg-paper border-border rounded-sm h-11"
          />
        )}

        {field.type === "date" && (
          <Input 
            type="date" 
            value={value}
            onChange={onChange}
            className="bg-paper border-border rounded-sm h-11"
          />
        )}

        {field.type === "boolean" && (
          <div className="flex items-center gap-3 p-4 bg-canvas/50 border border-border border-dashed rounded-sm">
            <input 
              type="checkbox" 
              checked={!!value}
              onChange={(e) => setContent(prev => ({ ...prev, [field.slug]: e.target.checked }))}
              className="size-4 rounded-sm border-border accent-accent cursor-pointer"
            />
            <span className="text-xs text-ink-muted font-medium">{field.name}</span>
          </div>
        )}

        {field.type === "media" && (
          <div className="group p-8 border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-4 text-ink-faint bg-paper hover:bg-canvas hover:border-accent transition-all cursor-pointer">
             <div className="size-10 rounded-full bg-canvas border border-border flex items-center justify-center group-hover:text-accent group-hover:border-accent transition-all">
                <Info className="size-4" />
             </div>
             <div className="text-center">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Media Picker</p>
               <p className="text-[9px] font-light">Select from library or upload new</p>
             </div>
             <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest text-accent hover:bg-accent/10">
               Select File
             </Button>
          </div>
        )}

        {field.type === "reference" && (
          <select 
            value={value}
            onChange={onChange}
            className="w-full bg-paper border border-border rounded-sm px-4 h-11 text-sm text-ink outline-none focus:border-accent transition-all appearance-none"
          >
            <option value="">Select entry...</option>
          </select>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="flex items-start gap-6">
          <Button asChild variant="outline" size="icon" className="size-11 rounded-full border-border bg-paper hover:bg-canvas transition-all shadow-sm">
            <Link href={`/dashboard/content-types/${contentTypeId}/entries`}>
              <ArrowLeft className="size-4 text-ink-muted" />
            </Link>
          </Button>
          <div className="space-y-1.5">
             <div className="flex items-center gap-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-faint mb-2">
              <Link href="/dashboard/content-types" className="hover:text-ink transition-colors no-underline">Content Types</Link>
              <ChevronRight className="size-3 opacity-30" />
              <Link href={`/dashboard/content-types/${contentTypeId}/entries`} className="hover:text-ink transition-colors no-underline">{contentType?.title || "Type"}</Link>
              <ChevronRight className="size-3 opacity-30" />
              <span className="text-accent">New Entry</span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-ink">
              Create <em className="italic text-accent not-italic">Entry</em>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-11 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm border-border bg-paper hover:bg-canvas">
            <Eye className="size-4 mr-2.5" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-xl"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="size-4 mr-2.5" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Content: Dynamic Form */}
        <div className="lg:col-span-3 space-y-10">
          <Card className="bg-paper border-border rounded-sm shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
               <Sparkles className="size-48" />
            </div>
            <CardContent className="p-12 space-y-10 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-1.5 h-6 bg-accent-bright" />
                <h2 className="text-2xl font-display font-semibold text-ink">Content Details</h2>
              </div>
              
              <div className="space-y-12">
                {contentType?.fields?.map(renderField)}
                {(!contentType?.fields || contentType.fields.length === 0) && (
                  <div className="py-32 text-center bg-canvas/30 rounded-sm border border-dashed border-border">
                    <p className="text-ink-muted text-sm font-light mb-6">This content type has no fields defined.</p>
                    <Button asChild variant="outline" className="text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      <Link href={`/dashboard/content-types/${contentTypeId}`}>
                        Define Schema
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Entry Info */}
        <aside className="lg:col-span-1 space-y-8">
          <Card className="bg-paper border-border rounded-sm shadow-sm">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold text-ink">Publishing</h3>
                <Badge variant="outline" className="px-2 py-0.5 rounded-sm bg-canvas border-border text-[9px] font-bold uppercase tracking-widest text-ink-faint">
                   v1.0
                </Badge>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                    <Lock className="size-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    Visibility
                  </div>
                  <span className="text-[11px] font-mono text-ink">Public</span>
                </div>
                
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                     <Globe className="size-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                     Status
                  </div>
                  <button 
                    onClick={() => setPublished(!published)}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm border transition-all",
                      published 
                        ? "bg-success/10 text-success border-success/20" 
                        : "bg-ink-muted/5 text-ink-muted border-border hover:bg-canvas"
                    )}
                  >
                    {published ? "Published" : "Draft"}
                  </button>
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-4">
                <button className="w-full flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted hover:text-ink transition-colors group">
                  <div className="flex items-center gap-3">
                    <History className="size-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span>History</span>
                  </div>
                  <ChevronRight className="size-3 opacity-20 group-hover:opacity-100 transition-all" />
                </button>
                <button className="w-full flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-destructive/60 hover:text-destructive transition-colors group">
                  <div className="flex items-center gap-3">
                    <Info className="size-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span>Discard</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 bg-sidebar rounded-sm border-none relative overflow-hidden group">
             <div className="absolute inset-0 noise-overlay opacity-20" />
             <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-accent-bright animate-pulse shadow-[0_0_10px_rgba(var(--accent-bright-rgb),0.5)]" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">API Blueprint</h4>
               </div>
               <div className="space-y-4 font-mono text-[10px] leading-relaxed text-white/40">
                 <div>
                   <p className="text-white/20 uppercase tracking-tighter mb-1">Content ID</p>
                   <p className="text-white/60 truncate">{contentTypeId}</p>
                 </div>
                 <div>
                   <p className="text-white/20 uppercase tracking-tighter mb-1">Slug Reference</p>
                   <p className="text-white/60">{contentType?.slug || "..."}</p>
                 </div>
                 <div className="pt-2">
                   <p className="text-white/20 uppercase tracking-tighter mb-1">Locale</p>
                   <Badge variant="outline" className="px-1.5 py-0 rounded-sm border-white/10 text-white/40 text-[9px] font-bold">
                     en-US
                   </Badge>
                 </div>
               </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
