"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, X, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  label: string;
  desc: string;
  href: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  stats: {
    collections: number;
    entries: number;
    mediaCount: number;
    apiRequests: number;
    publishedCount: number;
  };
  onDismiss: () => void;
}

export function OnboardingChecklist({ stats, onDismiss }: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; size: number }[]>([]);

  // Check items based on actual DB stats!
  // Pre-provisioned: collections = 2, entries = 2.
  // Success means they created their first CUSTOM collection/entry, uploaded media, triggered API request, or published.
  const items: ChecklistItem[] = [
    {
      id: "collection",
      label: "Create a custom Content Type",
      desc: "Define your custom schema and field properties in the Studio.",
      href: "/dashboard/collections/new",
      completed: stats.collections > 2,
    },
    {
      id: "entry",
      label: "Create a custom Entry",
      desc: "Add your own custom content record into any collection.",
      href: "/dashboard/collections",
      completed: stats.entries > 2,
    },
    {
      id: "api",
      label: "Generate your first API request",
      desc: "Hit the REST endpoints to retrieve content delivery JSON.",
      href: "#first-api-widget",
      completed: stats.apiRequests > 0,
    },
    {
      id: "media",
      label: "Upload your first Media asset",
      desc: "Upload an image, document, or media asset in the Media Library.",
      href: "/dashboard/media",
      completed: stats.mediaCount > 0,
    },
    {
      id: "publish",
      label: "Publish a custom Content Entry",
      desc: "Advance an entry status to PUBLISHED to push it to the CDN.",
      href: "/dashboard/collections",
      completed: stats.publishedCount > 2 || (stats.publishedCount > 0 && (stats.entries > 2)),
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const isFinished = completedCount === items.length;

  // Trigger celebration particle effect when completed!
  useEffect(() => {
    if (isFinished && !celebrated) {
      setCelebrated(true);
      
      // Spawn particles
      const colors = ["#CBE54C", "#A2C309", "#FFFFFF", "#387D44"];
      const newParticles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // center-relative offset
        y: Math.random() * 100 - 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
      }));
      setParticles(newParticles);
      
      // Clear particles after a few seconds
      setTimeout(() => {
        setParticles([]);
      }, 4000);
    }
  }, [isFinished, celebrated]);

  return (
    <Card className="bg-paper border-border rounded-sm shadow-xl overflow-hidden relative group">
      {/* Sparkly Top Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent-bright to-accent" />
      
      {/* Completion Celebration Overlay Particles */}
      <AnimatePresence>
        {particles.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: [1, 1.5, 0.5],
                  x: p.x * 6,
                  y: p.y * 6 - 150,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
                className="absolute rounded-full shadow-lg"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  boxShadow: `0 0 10px ${p.color}`,
                }}
              />
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#0F110A] border border-accent/30 p-6 rounded-sm text-center shadow-2xl relative z-50 max-w-sm mx-auto"
            >
              <Sparkles className="size-8 text-accent mx-auto mb-3 animate-spin" />
              <h4 className="font-display text-xl font-bold text-white mb-1">Checklist Completed! 🎉</h4>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Amazing job! You have fully set up your FlowCMS sandbox, ran API integrations, and published assets. You are ready for takeoff!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <CardTitle className="font-display text-xl font-semibold text-ink">
              Getting Started Checklist
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-ink-muted leading-relaxed font-light">
            Complete these developer quickstart steps to build your custom setup.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="size-8 text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5"
          >
            {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="size-8 text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5"
            title="Dismiss checklist"
          >
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-8 pt-2 space-y-6">
        {/* Progress Metrics */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
              Uplink Progress
            </span>
            <span className="font-mono text-[11px] font-bold text-accent">
              {percentage}% ({completedCount}/{items.length} tasks)
            </span>
          </div>
          <Progress value={percentage} className="h-1.5 bg-canvas" />
        </div>

        {/* Task List */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-4 overflow-hidden"
            >
              <div className="divide-y divide-border border-t border-b border-border">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex items-start justify-between gap-6 hover:bg-canvas/10 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {item.completed ? (
                        <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="size-5 text-ink-faint shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-[13px] font-semibold leading-tight ${item.completed ? "text-ink-muted line-through" : "text-ink"}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-ink-muted font-light leading-relaxed mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    
                    {!item.completed && (
                      <Button
                        asChild
                        variant="ghost"
                        size="xs"
                        className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent hover:bg-accent/5 shrink-0"
                      >
                        <Link href={item.href}>
                          Configure <ArrowRight className="size-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
