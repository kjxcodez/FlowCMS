"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Layers, CheckCircle2, Zap, ArrowRight } from "lucide-react";

export function TutorialStep({ 
  workspaceName, 
  onNext 
}: { 
  workspaceName: string;
  onNext: (schemaName: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const templates = [
    { id: "blog", name: "Blog Engine", desc: "For technical writing and editorial workflows.", icon: Zap },
    { id: "docs", name: "Internal Docs", desc: "Knowledge management for high-velocity teams.", icon: Layers },
    { id: "custom", name: "Empty Vessel", desc: "Build your own custom orchestration schema.", icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-accent font-mono text-[10px] font-bold uppercase tracking-[0.3em]">
          <Layers className="size-4" />
          Protocol 02: Architectural Blueprint
        </div>
        <h2 className="font-display text-4xl font-semibold text-white">
          Deploy your first <em className="italic text-accent not-italic">Schema</em>.
        </h2>
        <p className="text-white/40 font-light leading-relaxed max-w-2xl">
          The <span className="text-white/60">{workspaceName}</span> command center requires a content structure. 
          Choose a blueprint to initialize the registry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((t) => {
          const Icon = t.icon;
          const isActive = selected === t.id;
          
          return (
            <motion.button
              key={t.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(t.id)}
              className={cn(
                "relative text-left p-8 rounded-sm border transition-all duration-500 overflow-hidden group",
                isActive 
                  ? "bg-accent/10 border-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.1)]" 
                  : "bg-white/[0.03] border-white/10 hover:border-white/20"
              )}
            >
              <div className={cn(
                "size-12 rounded-sm mb-6 flex items-center justify-center transition-all duration-500",
                isActive ? "bg-accent text-white" : "bg-white/5 text-white/20 group-hover:text-white/40"
              )}>
                <Icon className="size-6" />
              </div>
              
              <div className="space-y-2 relative z-10">
                <h3 className={cn(
                  "font-display text-xl font-semibold transition-colors",
                  isActive ? "text-white" : "text-white/60"
                )}>
                  {t.name}
                </h3>
                <p className="text-xs text-white/30 leading-relaxed font-light">
                  {t.desc}
                </p>
              </div>

              {isActive && (
                <motion.div 
                  layoutId="glow"
                  className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent pointer-events-none"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-end pt-8">
        <Button 
          disabled={!selected}
          onClick={() => onNext(templates.find(t => t.id === selected)?.name || "Custom")}
          className="h-14 px-12 text-[11px] font-bold uppercase tracking-[0.3em] rounded-sm bg-white text-sidebar hover:bg-accent hover:text-white transition-all shadow-2xl disabled:opacity-20"
        >
          Initialize Blueprint
          <ArrowRight className="size-4 ml-3" />
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
