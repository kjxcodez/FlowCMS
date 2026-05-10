"use client";

import React from "react";
import { CONTENT_TYPE_TEMPLATES } from "@/config/templates/content-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Layers, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TemplateBrowser() {
  const router = useRouter();
  const [applying, setApplying] = React.useState<string | null>(null);

  const handleApply = async (templateId: string) => {
    setApplying(templateId);
    try {
      const res = await fetch("/api/internal/content-types/apply-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success("Template applied successfully!");
      router.push(`/dashboard/content-types/${result.data.id}`);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b-2 border-border pb-4">
        <Sparkles className="size-5 text-accent" />
        <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
          Industrial <span className="text-accent">Blueprints</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CONTENT_TYPE_TEMPLATES.map((t) => (
          <Card key={t.id} className="rounded-none border-2 border-border hover:border-accent transition-all duration-300 group overflow-hidden bg-paper relative">
            <CardHeader className="pb-4 border-b border-border/30">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="rounded-none font-mono text-[9px] uppercase tracking-widest bg-muted/50 border-border">
                  {t.category}
                </Badge>
                <Layers className="size-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <CardTitle className="font-display text-xl tracking-tight italic group-hover:text-accent transition-colors">{t.name}</CardTitle>
              <CardDescription className="text-xs font-medium leading-relaxed mt-1">{t.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 flex-wrap mb-8">
                {t.fields.slice(0, 4).map((f) => (
                  <span key={f.id} className="text-[9px] font-mono bg-canvas border border-border px-2 py-1 uppercase tracking-tight text-ink-muted">
                    {f.slug}
                  </span>
                ))}
                {t.fields.length > 4 && (
                  <span className="text-[9px] font-mono text-accent font-bold">+{t.fields.length - 4} MORE</span>
                )}
              </div>
              <Button 
                onClick={() => handleApply(t.id)} 
                disabled={!!applying}
                className="w-full rounded-none font-bold uppercase tracking-[0.2em] text-[10px] h-12 bg-sidebar hover:bg-sidebar-dim transition-all"
              >
                {applying === t.id ? "Initializing..." : "Clone Schema"}
                <ArrowRight className="size-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
            <div className="absolute inset-0 pointer-events-none noise-overlay opacity-5" />
          </Card>
        ))}
      </div>
    </div>
  );
}
