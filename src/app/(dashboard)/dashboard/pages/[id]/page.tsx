"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Settings2,
  ChevronRight,
  Search,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { Block } from "@/types/cms";
import { usePage, useUpdatePage, useDeletePage } from "@/hooks/use-pages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { purgeCacheTags } from "@/lib/cloudflare";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function EditPageEditor() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: page, isLoading } = usePage(id);
  const updateMutation = useUpdatePage();
  const deleteMutation = useDeletePage();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  // SEO State
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setBlocks(page.blocks as Block[]);
      setStatus(page.status as "DRAFT" | "PUBLISHED");
      setSeoTitle(page.seoTitle || "");
      setSeoDesc(page.seoDesc || "");
      setOgImage(page.ogImage || "");
      setCanonicalUrl(page.canonicalUrl || "");
      setNoIndex(page.noIndex || false);
    }
  }, [page]);

  const handleSave = async () => {
    if (!title || !slug) return;
    setIsSaving(true);

    try {
      await updateMutation.mutateAsync({
        id,
        title,
        slug,
        blocks,
        status,
        seoTitle,
        seoDesc,
        ogImage,
        canonicalUrl,
        noIndex,
      });
      setIsSaving(false);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="py-32 text-center font-mono text-[10px] uppercase tracking-widest opacity-30 animate-pulse">Synchronizing Blueprint...</div>;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 pb-32">
      {/* Top Bar Actions */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pages"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink-muted hover:text-ink transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-ink-faint mb-1">
              <Link href="/dashboard/pages" className="hover:text-ink-muted no-underline">Pages</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-accent">{title || "Untitled Page"}</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Edit <em>Page</em>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-canvas border border-border rounded px-1 py-1 mr-2">
            <button
              onClick={() => setStatus("DRAFT")}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all border-none cursor-pointer",
                status === "DRAFT" ? "bg-paper text-ink shadow-sm" : "bg-transparent text-ink-muted"
              )}
            >
              Draft
            </button>
            <button
              onClick={() => setStatus("PUBLISHED")}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all border-none cursor-pointer",
                status === "PUBLISHED" ? "bg-accent text-white shadow-sm" : "bg-transparent text-ink-muted"
              )}
            >
              Published
            </button>
          </div>

          <Button variant="outline" className="h-10 text-[10px] font-bold uppercase tracking-widest border-border text-ink-muted hover:text-ink">
            <Eye className="w-3.5 h-3.5 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title || !slug}
            className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest shadow-xl"
          >
            <Save className="w-3.5 h-3.5 mr-2" />
            {isSaving ? "Saving..." : "Save Page"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="canvas" className="space-y-12">
        <TabsList className="rounded-none h-14 p-1 bg-canvas border-2 border-border grid grid-cols-2 max-w-md">
          <TabsTrigger value="canvas" className="rounded-none font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-sidebar data-[state=active]:text-white">
            Canvas Editor
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-none font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-sidebar data-[state=active]:text-white">
            SEO & Metadata
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canvas">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3 space-y-12">
              {showSettings && (
                <Card className="bg-paper border-border rounded-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-accent" />
                      <CardTitle className="font-display text-xl">Page Configuration</CardTitle>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="bg-transparent border-none text-[10px] font-mono uppercase tracking-widest text-ink-faint hover:text-ink cursor-pointer">Hide</button>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] font-semibold text-ink-muted uppercase tracking-widest">
                        Page Title
                      </Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Home Page"
                        className="bg-canvas border-border rounded-sm h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] font-semibold text-ink-muted uppercase tracking-widest">
                        Path Slug
                      </Label>
                      <div className="flex items-center bg-canvas border border-border rounded px-4 overflow-hidden focus-within:border-accent transition-all">
                        <span className="text-xs text-ink-faint font-mono">/</span>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="home"
                          className="flex-1 bg-transparent border-none h-11 text-sm text-ink font-mono outline-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent" />
                    <h2 className="font-display text-xl font-semibold text-ink">Layout Canvas</h2>
                  </div>
                  {!showSettings && (
                    <button onClick={() => setShowSettings(true)} className="bg-transparent border-none flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink-muted hover:text-ink cursor-pointer">
                      <Settings2 className="w-3 h-3" /> Page Settings
                    </button>
                  )}
                </div>

                <BlockEditor blocks={blocks} onChange={setBlocks} />
              </section>
            </div>

            <aside className="lg:col-span-1 space-y-6">
              <div className="p-6 bg-canvas border border-border rounded-sm space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Page Status</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ink-muted">Version</span>
                    <span className="text-[11px] font-mono text-ink">v1.0.4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ink-muted">Environment</span>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0">Production</Badge>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="max-w-3xl space-y-12">
            <Card className="bg-paper border-border rounded-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-accent" />
                  <CardTitle className="font-display text-2xl">Search Engine Optimization</CardTitle>
                </div>
                <CardDescription className="font-light">
                  Control how this page appears in search results and social media shares.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-10">
                <div className="space-y-4">
                  <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">Meta Title</Label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title}
                    className="bg-canvas border-border h-11"
                  />
                  <p className="text-[10px] text-ink-faint">Recommended length: 50-60 characters.</p>
                </div>

                <div className="space-y-4">
                  <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">Meta Description</Label>
                  <textarea
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-canvas border border-border rounded-sm px-4 py-3 text-sm text-ink outline-none focus:border-accent transition-all resize-none"
                    placeholder="Brief summary of the page content..."
                  />
                  <p className="text-[10px] text-ink-faint">Recommended length: 150-160 characters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-4">
                    <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">Open Graph Image</Label>
                    <div className="flex gap-2">
                      <Input
                        value={ogImage}
                        onChange={(e) => setOgImage(e.target.value)}
                        placeholder="https://..."
                        className="bg-canvas border-border h-11"
                      />
                      <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 border-border bg-canvas">
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">Canonical URL</Label>
                    <Input
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-canvas border-border h-11"
                    />
                  </div>
                </div>

                <Separator className="my-8" />

                <div className="flex items-center justify-between p-6 bg-canvas border border-border border-dashed rounded-sm">
                  <div className="space-y-1">
                    <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink">Robots: NoIndex</Label>
                    <p className="text-[11px] text-ink-muted">Prevent search engines from indexing this page.</p>
                  </div>
                  <Switch
                    checked={noIndex}
                    onCheckedChange={setNoIndex}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Google Preview Simulation */}
            <div className="p-10 bg-canvas border border-border rounded-sm space-y-6">
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-faint">Search Preview</h4>
              <div className="space-y-2">
                <div className="text-[14px] text-[#1a0dab] font-sans hover:underline cursor-pointer truncate">
                  {seoTitle || title || "Untitled Page"}
                </div>
                <div className="text-[12px] text-[#006621] font-sans truncate">
                  your-site.com/{slug}
                </div>
                <div className="text-[13px] text-[#545454] font-sans leading-relaxed line-clamp-2">
                  {seoDesc || "Define a meta description to control how this page appears in search results. If left blank, engines will try to find relevant text from your blocks."}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
