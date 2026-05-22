"use client";

import React, { useState } from "react";
import { 
  X, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Copy, 
  Check, 
  Globe, 
  Zap,
  Code,
  Layout
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface SandboxPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  fields?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  collectionSlug: string;
  entrySlug: string;
}

export function SandboxPreview({
  isOpen,
  onClose,
  data,
  fields,
  collectionSlug,
  entrySlug,
}: SandboxPreviewProps) {
  const [viewMode, setViewMode] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [activeTab, setActiveTab] = useState<"render" | "json">("render");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const viewportWidths = {
    mobile: "w-[375px]",
    tablet: "w-[768px]",
    desktop: "w-full",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-paper/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-paper border border-border-strong shadow-2xl rounded-sm w-full h-full max-w-6xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-paper/50">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-accent-bright animate-pulse" />
                  <h3 className="font-display text-lg font-bold text-ink uppercase tracking-wider">Sandbox Preview</h3>
                </div>
                
                <div className="hidden md:flex items-center bg-canvas p-1 rounded-sm border border-border">
                  <button 
                    onClick={() => setActiveTab("render")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest transition-all",
                      activeTab === "render" ? "bg-accent text-paper font-bold" : "text-ink-muted hover:text-ink"
                    )}
                  >
                    <Layout className="size-3" />
                    Visual
                  </button>
                  <button 
                    onClick={() => setActiveTab("json")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest transition-all",
                      activeTab === "json" ? "bg-accent text-paper font-bold" : "text-ink-muted hover:text-ink"
                    )}
                  >
                    <Code className="size-3" />
                    JSON
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-canvas border border-border rounded-sm font-mono text-[10px] text-ink-muted">
                  <Globe className="size-3 text-accent" />
                  <span>api.flowcms.com/v1/entries/{collectionSlug}/{entrySlug}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-canvas">
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-canvas/30">
               <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode("mobile")}
                    className={cn("size-9 p-0", viewMode === "mobile" && "text-accent bg-accent/5")}
                  >
                    <Smartphone className="size-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode("tablet")}
                    className={cn("size-9 p-0", viewMode === "tablet" && "text-accent bg-accent/5")}
                  >
                    <Tablet className="size-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode("desktop")}
                    className={cn("size-9 p-0", viewMode === "desktop" && "text-accent bg-accent/5")}
                  >
                    <Monitor className="size-4" />
                  </Button>
               </div>

               {activeTab === "json" && (
                 <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 text-[9px] font-bold uppercase tracking-widest gap-2">
                   {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                   {copied ? "Copied" : "Copy JSON"}
                 </Button>
               )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-canvas p-8 flex flex-col items-center custom-scrollbar">
               {activeTab === "render" ? (
                 <div className={cn(
                   "bg-paper shadow-xl border border-border-strong rounded-sm transition-all duration-500 overflow-hidden min-h-full",
                   viewportWidths[viewMode]
                 )}>
                   {/* Fake Browser Top */}
                   <div className="h-10 bg-canvas border-b border-border flex items-center px-4 gap-2">
                      <div className="size-2 rounded-full bg-border" />
                      <div className="size-2 rounded-full bg-border" />
                      <div className="size-2 rounded-full bg-border" />
                      <div className="flex-1 mx-4 h-6 bg-paper rounded-sm border border-border flex items-center px-3">
                         <span className="text-[9px] font-mono text-ink-faint">https://preview.flowcms.local/{collectionSlug}/{entrySlug}</span>
                      </div>
                   </div>
                   
                   <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="space-y-4">
                        <h1 className="font-display text-4xl font-bold text-ink leading-tight">
                          {data.title || data.name || data.heading || "Untitled Entry"}
                        </h1>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-ink-muted uppercase tracking-widest pb-8 border-b border-border">
                           <span className="flex items-center gap-1.5"><Zap className="size-3 text-accent" /> Generated via Schema</span>
                           <span>•</span>
                           <span>{collectionSlug}</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {Object.entries(data).map(([key, value]) => {
                          if (["title", "name", "heading", "id", "slug", "createdAt", "updatedAt"].includes(key)) return null;
                          
                          const field = fields?.find(f => f.slug === key);
                          const isReference = field?.type === "reference";

                          return (
                            <div key={key} className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <p className="font-mono text-[9px] font-bold text-ink-faint uppercase tracking-widest">{key}</p>
                                 {isReference && (
                                   <Badge variant="outline" className="text-[8px] font-mono border-accent/20 text-accent h-4 uppercase">Reference</Badge>
                                 )}
                               </div>
                               <div className="text-sm text-ink-muted leading-relaxed">
                                 {isReference ? (
                                   <div className="p-3 bg-canvas border border-border rounded-sm flex items-center gap-3">
                                      <div className="size-2 rounded-full bg-accent" />
                                      <span className="font-mono text-[10px]">{value as string}</span>
                                   </div>
                                 ) : typeof value === "string" ? (
                                   value.startsWith("http") ? (
                                     <Image src={value} alt={key} className="max-w-full rounded-sm border border-border grayscale" />
                                   ) : (
                                     <div dangerouslySetInnerHTML={{ __html: value }} />
                                   )
                                 ) : (
                                   <pre className="bg-canvas p-4 rounded-sm border border-border font-mono text-[11px] overflow-auto">
                                      {JSON.stringify(value, null, 2)}
                                   </pre>
                                 )}
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                 </div>
               ) : (
                 <div className="w-full h-full max-w-4xl bg-[#0F1109] rounded-sm p-8 border border-white/10 font-mono text-xs text-white/80 overflow-auto custom-scrollbar">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                 </div>
               )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border bg-paper flex items-center justify-between text-[10px] font-mono text-ink-faint uppercase tracking-widest">
               <div className="flex items-center gap-4">
                  <span className="text-success font-bold">● System Ready</span>
                  <span>Latency: 2ms</span>
               </div>
               <div className="flex items-center gap-2">
                  <span>Powered by</span>
                  <span className="font-bold text-ink">Flow Engine</span>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
