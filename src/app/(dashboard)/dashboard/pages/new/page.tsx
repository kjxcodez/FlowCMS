"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Globe,
  Settings2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { Block } from "@/types/cms";
import { useCreatePage } from "@/hooks/use-pages";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTemplateBrowser } from "@/components/dashboard/templates/page-template-browser";

export default function NewPageEditor() {
  const router = useRouter();
  const createMutation = useCreatePage();
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [published, setPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, "")) {
      setSlug(val.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, ""));
    }
  };

  const handleSave = async () => {
    if (!title || !slug) return;
    setIsSaving(true);
    
    try {
      await createMutation.mutateAsync({
        title,
        slug,
        blocks,
        published,
      });
      router.push("/dashboard/pages");
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 pb-32">
      {/* Top Bar Actions */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/pages"
            className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
             <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--ink-faint)] mb-1">
              <Link href="/dashboard/pages" className="hover:text-[var(--ink-muted)]">Pages</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[var(--accent)]">{title || "Untitled Page"}</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
              Edit <em>Layout</em>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--canvas)] border border-[var(--border)] rounded px-1 py-1 mr-2">
            <button 
              onClick={() => setPublished(false)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                !published ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-muted)]"
              )}
            >
              Draft
            </button>
            <button 
              onClick={() => setPublished(true)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                published ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--ink-muted)]"
              )}
            >
              Published
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 h-10 border border-[var(--border)] rounded text-xs font-semibold uppercase tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title || !slug}
            className="flex items-center gap-2 px-6 h-10 bg-[var(--sidebar)] text-white rounded text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Page"}
          </button>
        </div>
      </header>

      <Tabs defaultValue="canvas" className="space-y-12">
        <TabsList className="rounded-none h-14 p-1 bg-[var(--canvas)] border-2 border-[var(--border)] grid grid-cols-2 max-w-md">
          <TabsTrigger value="canvas" className="rounded-none font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-[var(--sidebar)] data-[state=active]:text-white">
            Blank Canvas
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-none font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-[var(--sidebar)] data-[state=active]:text-white">
            Blueprints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canvas">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Editor Main Canvas */}
            <div className="lg:col-span-3 space-y-12">
              {/* Settings Section (Toggleable) */}
              {showSettings && (
                <section className="p-8 bg-[var(--paper)] border border-[var(--border)] rounded space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-[var(--accent)]" />
                      <h2 className="font-display text-xl font-semibold text-[var(--ink)]">Page Configuration</h2>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-faint)] hover:text-[var(--ink)]">Hide</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block font-mono text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest">
                        Page Title
                      </label>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Home Page"
                        className="w-full bg-[var(--canvas)] border border-[var(--border)] rounded px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block font-mono text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest">
                        Path Slug
                      </label>
                      <div className="flex items-center bg-[var(--canvas)] border border-[var(--border)] rounded px-4 overflow-hidden focus-within:border-[var(--accent)] transition-all">
                        <span className="text-xs text-[var(--ink-faint)] font-mono">/</span>
                        <input 
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="home"
                          className="flex-1 bg-transparent border-none py-2.5 text-sm text-[var(--ink)] font-mono outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Block Editor */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--accent)]" />
                    <h2 className="font-display text-xl font-semibold text-[var(--ink)]">Layout Canvas</h2>
                  </div>
                  {!showSettings && (
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)]">
                      <Settings2 className="w-3 h-3" /> Page Settings
                    </button>
                  )}
                </div>
                
                <BlockEditor blocks={blocks} onChange={setBlocks} />
              </section>
            </div>

            {/* Info Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="p-6 bg-[var(--canvas)] border border-[var(--border)] rounded space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">About Pages</h4>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  Pages allow you to build custom layouts using a block-based system. Each page is accessible via its unique slug in the public API.
                </p>
                <div className="pt-4 border-t border-[var(--border-strong)]">
                  <Link href="/docs/blocks" className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest hover:underline">
                    Block Guide
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <PageTemplateBrowser onApply={(tplBlocks) => {
            setBlocks(tplBlocks);
            // Optionally switch tab back to canvas
            const scratchTab = document.querySelector('[value="canvas"]') as HTMLElement;
            scratchTab?.click();
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
