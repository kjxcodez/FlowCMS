"use client";

import React from "react";
import { Layers, Plus, Image as ImageIcon, Key, BookOpen, Terminal, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

interface ActionItem {
  title: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  isExternal?: boolean;
  color: string;
  glowColor: string;
}

export function DeveloperQuickActions() {
  const actions: ActionItem[] = [
    {
      title: "Create Collection",
      desc: "Define content schemas and custom API properties.",
      href: "/dashboard/collections/new",
      icon: Layers,
      color: "text-accent",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(203,229,76,0.15)]",
    },
    {
      title: "Create Entry",
      desc: "Draft and publish new structured content records.",
      href: "/dashboard/collections",
      icon: Plus,
      color: "text-purple-400",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(192,132,252,0.15)]",
    },
    {
      title: "Upload Media",
      desc: "Add images, documents, and media assets to the library.",
      href: "/dashboard/media",
      icon: ImageIcon,
      color: "text-blue-400",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]",
    },
    {
      title: "Generate API Key",
      desc: "Provision tokens for public content deliveries.",
      href: "/dashboard/api-keys",
      icon: Key,
      color: "text-amber-400",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]",
    },
    {
      title: "Read Docs",
      desc: "Learn integration patterns and type-safe SDK usage.",
      href: APP_CONFIG.docsUrl || "https://docs.flowcms.com",
      icon: BookOpen,
      isExternal: true,
      color: "text-emerald-400",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]",
    },
    {
      title: "Open API Explorer",
      desc: "Simulate queries and review live JSON response bodies.",
      href: "#first-api-widget",
      icon: Terminal,
      color: "text-pink-400",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(244,114,182,0.15)]",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-semibold text-ink">
          Developer Quick Actions
        </h3>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          Quickstart uplink
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((act, idx) => {
          const CardInner = (
            <Card className={`h-full bg-paper border-border rounded-sm p-6 cursor-pointer overflow-hidden relative group transition-all duration-300 hover:border-accent ${act.glowColor}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-white/[0.03] transition-all pointer-events-none" />
              <CardContent className="p-0 flex flex-col justify-between h-full gap-8">
                <div className="flex justify-between items-start">
                  <div className={`size-12 rounded-sm bg-canvas border border-border flex items-center justify-center group-hover:border-accent/40 group-hover:bg-accent/5 transition-all shadow-sm`}>
                    <act.icon className={`size-5 ${act.color} transition-transform group-hover:scale-110 duration-300`} />
                  </div>
                  <ArrowUpRight className="size-4 text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-base font-semibold text-ink group-hover:text-accent transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-ink-muted font-light leading-relaxed">
                    {act.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          );

          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {act.isExternal ? (
                <a
                  href={act.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline block h-full"
                >
                  {CardInner}
                </a>
              ) : (
                <Link href={act.href} className="no-underline block h-full">
                  {CardInner}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
