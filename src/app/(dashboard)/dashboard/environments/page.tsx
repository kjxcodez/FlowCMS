"use client";

import React from "react";
import { 
  GitBranch, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  Info,
  Lock,
  Zap
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useEnvironments } from "@/hooks/use-environments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function EnvironmentsPage() {
  const { data: workspace } = useWorkspace();
  const { data: environments, isLoading } = useEnvironments(workspace?.id);
  const plan = workspace?.plan ?? "HOBBY";
  const isHobby = plan === "HOBBY";

  if (isLoading) return <div className="py-32 text-center font-mono text-[10px] uppercase tracking-widest opacity-30 animate-pulse">Mapping Infrastructure...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="space-y-1.5">
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            Workspace <em className="italic text-accent not-italic">Environments</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Isolate your content development workflow with staging and production environments.
          </p>
        </div>
        
        <div className="relative group">
          {isHobby && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-xl z-20 whitespace-nowrap">
              Upgrade to Pro for more environments
            </div>
          )}
          <Button 
            disabled={isHobby}
            className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg"
          >
            {isHobby ? <Lock className="size-3.5 mr-2" /> : <Plus className="size-4 mr-2" />}
            New Environment
          </Button>
        </div>
      </header>

      {/* Environments List */}
      <div className="space-y-6">
        {environments?.map((env: any) => (
          <Card key={env.id} className="bg-paper border-border rounded-sm overflow-hidden group hover:border-accent transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center p-8 gap-8">
                <div className="w-14 h-14 rounded-sm bg-canvas border border-border flex items-center justify-center shrink-0">
                   <GitBranch className={cn("size-6", env.isDefault ? "text-accent" : "text-ink-faint")} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-xl font-semibold text-ink">{env.name}</h3>
                    {env.isDefault && (
                      <Badge className="bg-success/10 text-success border-success/20 rounded-sm text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">Slug: {env.slug}</p>
                </div>

                <div className="flex items-center gap-12 px-12 border-x border-border/50">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-faint">Entries</p>
                    <p className="text-lg font-display font-semibold text-ink">{env._count?.entries || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!env.isDefault && (
                    <Button variant="ghost" className="h-9 text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-accent">
                      Set Default
                    </Button>
                  )}
                  <Button variant="outline" className="h-9 text-[10px] font-bold uppercase tracking-widest border-border text-ink-muted hover:text-ink">
                    Settings
                  </Button>
                </div>
              </div>

              {/* Promo Banner for Promition flow */}
              <div className="px-8 py-4 bg-canvas/30 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-faint">
                  <Zap className="size-3.5 text-accent opacity-50" />
                  Promotion Flow: <span className="opacity-40 italic">Coming Soon</span>
                </div>
                <ChevronRight className="size-4 text-ink-faint opacity-20" />
              </div>
            </CardContent>
          </Card>
        ))}

        {(!environments || environments.length === 0) && (
          <div className="py-32 text-center bg-canvas/30 rounded-sm border border-dashed border-border flex flex-col items-center justify-center gap-6">
             <div className="size-16 rounded-full bg-paper border border-border flex items-center justify-center text-ink-faint">
                <Info className="size-8" />
             </div>
             <div className="space-y-2">
                <p className="text-ink font-semibold">No environments found</p>
                <p className="text-sm text-ink-muted font-light">Every workspace needs at least one environment to store content.</p>
             </div>
          </div>
        )}
      </div>

      {/* Upgrade Callout */}
      {isHobby && (
        <Card className="bg-sidebar border-none rounded-sm p-10 relative overflow-hidden group">
          <div className="absolute inset-0 noise-overlay opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
               <h3 className="font-display text-2xl font-semibold text-white">Need a <em className="italic text-accent-bright not-italic">Staging</em> environment?</h3>
               <p className="text-sm text-white/50 leading-relaxed font-light">
                 Hobby plans are limited to a single production environment. Upgrade to Pro or Agency to unlock multiple environments and Promotion Flows.
               </p>
            </div>
            <Button className="h-12 px-8 bg-white text-sidebar text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-accent-bright transition-all shadow-xl whitespace-nowrap">
               Upgrade Plan
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
