"use client";

import React, { useState } from "react";
import { Check, Copy, ExternalLink, Sparkles, Layers, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiKeys } from "@/hooks/use-api-keys";
import { toast } from "sonner";
import { motion } from "motion/react";
import Link from "next/link";

interface WelcomeCardProps {
  onDismiss: () => void;
}

export function WelcomeCard({ onDismiss }: WelcomeCardProps) {
  const { data: apiKeys } = useApiKeys();
  const [copied, setCopied] = useState(false);

  const activeKey = apiKeys?.[0]?.key || "";

  const handleCopyKey = () => {
    if (!activeKey) {
      toast.error("No API key available yet.");
      return;
    }
    navigator.clipboard.writeText(activeKey);
    setCopied(true);
    toast.success("Default API Key copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="relative bg-[#0F110A] border-accent/20 border-l-4 border-l-accent overflow-hidden shadow-2xl p-8 md:p-10 group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-accent/10 transition-all duration-500 pointer-events-none" />
        
        <CardContent className="p-0 flex flex-col lg:flex-row gap-8 lg:items-center relative z-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Sparkles className="size-5 text-accent animate-pulse" />
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Early Access Beta</span>
            </div>
            
            <div className="space-y-3">
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight">
                Welcome to FlowCMS <span className="inline-block hover:animate-bounce">👋</span>
              </h2>
              <p className="text-white/60 text-sm max-w-xl font-light leading-relaxed">
                Your workspace is ready for action. We have already generated your sandbox resources, starter content, and primary API access credentials.
              </p>
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5 text-xs text-white/80 font-light">
                <div className="size-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                  <Check className="size-3.5 text-success" />
                </div>
                <span>✓ Production environment created</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/80 font-light">
                <div className="size-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                  <Check className="size-3.5 text-success" />
                </div>
                <span>✓ API Key &quot;Default Development Key&quot; active</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/80 font-light">
                <div className="size-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                  <Check className="size-3.5 text-success" />
                </div>
                <span>✓ &quot;Blog&quot; collection provisioned</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/80 font-light">
                <div className="size-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                  <Check className="size-3.5 text-success" />
                </div>
                <span>✓ Seeded starter entries (Hello World)</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                onClick={handleCopyKey}
                className="h-12 px-6 rounded-sm bg-accent text-sidebar hover:bg-accent-bright font-mono text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(var(--accent-bright-rgb),0.2)] transition-all duration-300"
              >
                {copied ? <Check className="size-3.5 mr-2" /> : <Copy className="size-3.5 mr-2" />}
                Copy API Key
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 px-6 rounded-sm border-white/10 hover:border-white/30 text-white/80 hover:text-white font-mono text-[10px] uppercase tracking-widest bg-transparent"
              >
                <Link href="/docs">
                  <BookOpen className="size-3.5 mr-2 text-white/40" />
                  Open Docs
                  <ExternalLink className="size-3 ml-1.5 opacity-50" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 px-6 rounded-sm border-white/10 hover:border-white/30 text-white/80 hover:text-white font-mono text-[10px] uppercase tracking-widest bg-transparent"
              >
                <Link href="/dashboard/collections">
                  <Layers className="size-3.5 mr-2 text-white/40" />
                  View Collections
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:w-80 w-full p-6 rounded-sm bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="size-4 shrink-0" />
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Immediate Sandbox</h4>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed font-light">
              You are ready to query. Your pre-seeded &quot;First Post&quot; and &quot;Home&quot; pages are active on our edge content CDN under the Hobby tier limitations.
            </p>
            <button
              onClick={onDismiss}
              className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 hover:text-white/70 block w-full text-left pt-2 border-t border-white/5 hover:underline"
            >
              Hide Welcome Banner
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
