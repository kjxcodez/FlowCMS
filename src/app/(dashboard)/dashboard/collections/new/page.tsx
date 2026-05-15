"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Layers, 
  Info,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FieldBuilder } from "@/components/content-types/FieldBuilder";
import { FieldDefinition } from "@/types/cms";
import { useCreateCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateBrowser } from "@/components/dashboard/templates/template-browser";

export default function NewCollectionPage() {
  const router = useRouter();
  const createMutation = useCreateCollection();
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"STRUCTURED" | "VISUAL">("STRUCTURED");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug
    if (!slug || slug === name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, "")) {
      setSlug(val.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, ""));
    }
  };

  const handleSave = async () => {
    if (!name || !slug) return;
    setIsSaving(true);
    
    try {
      await createMutation.mutateAsync({
        name,
        slug,
        description,
        mode,
        fields: mode === "VISUAL" ? [] : fields,
      });
      router.push("/dashboard/collections");
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center justify-between">
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
              <span className="text-accent">New Collection</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Create <em className="italic text-accent not-italic">Collection</em>
            </h1>
          </div>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={isSaving || !name || !slug}
          className="rounded-sm px-6 h-11 text-[11px] font-bold uppercase tracking-widest"
        >
          {isSaving ? "Saving..." : (
            <>
              <Save className="size-4 mr-2" />
              Save Collection
            </>
          )}
        </Button>
      </header>

      <Tabs defaultValue="scratch" className="space-y-12">
        <TabsList className="rounded-none h-14 p-1 bg-muted border-2 border-border grid grid-cols-2 max-w-md">
          <TabsTrigger value="scratch" className="rounded-none font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-sidebar data-[state=active]:text-white">
            Custom Schema
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-none font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-sidebar data-[state=active]:text-white">
            Industrial Blueprints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scratch">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content: Field Builder */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Layers className="size-4 text-accent" />
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {mode === "VISUAL" ? "Block Canvas" : "Field Definitions"}
                  </h2>
                </div>
                {mode === "VISUAL" ? (
                  <div className="p-12 border-2 border-dashed border-border rounded-lg bg-canvas flex flex-col items-center justify-center text-center space-y-4">
                    <div className="size-12 rounded-full bg-paper flex items-center justify-center border border-border">
                      <Layers className="size-6 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-semibold text-ink">Visual Canvas Enabled</h3>
                      <p className="text-sm text-ink-muted max-w-sm">
                        Entries in this collection will use the Block Editor. No fields are required.
                      </p>
                    </div>
                  </div>
                ) : (
                  <FieldBuilder fields={fields} onChange={setFields} />
                )}
              </section>
            </div>

            {/* Sidebar: Configuration */}
            <aside className="lg:col-span-1 space-y-8">
              <section className="p-8 bg-paper border border-border rounded-lg space-y-6">
                <h3 className="font-display text-lg font-semibold text-ink">Configuration</h3>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="block font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                      Collection Mode
                    </Label>
                    <div className="flex items-center bg-canvas border border-border rounded px-1 py-1">
                      <button
                        onClick={() => setMode("STRUCTURED")}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all border-none cursor-pointer",
                          mode === "STRUCTURED" ? "bg-paper text-ink shadow-sm" : "bg-transparent text-ink-muted"
                        )}
                      >
                        Structured
                      </button>
                      <button
                        onClick={() => setMode("VISUAL")}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all border-none cursor-pointer",
                          mode === "VISUAL" ? "bg-paper text-ink shadow-sm" : "bg-transparent text-ink-muted"
                        )}
                      >
                        Visual
                      </button>
                    </div>
                    <p className="text-[10px] text-ink-faint mt-1">
                      {mode === "STRUCTURED" 
                        ? "Best for lists, blog posts, and data-heavy content." 
                        : "Best for landing pages and marketing content using blocks."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="block font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                      Display Name
                    </Label>
                    <Input 
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Blog Post"
                      className="bg-canvas border-border h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="block font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                      API Slug
                    </Label>
                    <Input 
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. blog-post"
                      className="font-mono text-xs bg-canvas border-border h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="block font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                      Description
                    </Label>
                    <Textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="What is this collection for?"
                      className="bg-canvas border-border text-sm min-h-[80px]"
                    />
                  </div>
                </div>
              </section>

              <section className="p-6 bg-canvas border border-border rounded-lg flex gap-4">
                <Info className="size-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-ink uppercase tracking-widest">About Collections</h4>
                  <p className="text-[12px] text-ink-muted leading-relaxed font-light">
                    Collections define the structure of your data. Once saved, you can start creating entries based on this schema.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateBrowser />
        </TabsContent>
      </Tabs>
    </div>
  );
}
