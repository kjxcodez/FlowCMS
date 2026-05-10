"use client";

import React from "react";
import { PAGE_TEMPLATES } from "@/config/templates/pages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Layout, Sparkles } from "lucide-react";

interface PageTemplateBrowserProps {
  onApply: (blocks: any[]) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function PageTemplateBrowser({ onApply }: PageTemplateBrowserProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b-2 border-border pb-4">
        <Sparkles className="size-5 text-accent" />
        <h2 className="font-display text-2xl font-black italic uppercase tracking-tight">
          Structural <span className="text-accent">Blueprints</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PAGE_TEMPLATES.map((t) => (
          <Card key={t.id} className="rounded-none border-2 border-border hover:border-accent transition-all duration-300 group bg-paper flex flex-col">
            <CardHeader className="pb-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="rounded-none font-mono text-[9px] uppercase tracking-widest bg-muted/50 border-border">
                  {t.blocks.length} Blocks
                </Badge>
                <Layout className="size-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <CardTitle className="font-display text-lg tracking-tight italic group-hover:text-accent transition-colors">{t.name}</CardTitle>
              <CardDescription className="text-[11px] font-medium leading-relaxed mt-1">{t.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
               <Button 
                  onClick={() => onApply(t.blocks)} 
                  className="w-full rounded-none font-bold uppercase tracking-[0.2em] text-[9px] h-10 bg-sidebar hover:bg-sidebar-dim transition-all"
                >
                  Apply Layout
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
