"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, CopyIcon } from "./LandingIcons";
import { ChevronDownIcon, GripVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoBlock {
  id: string;
  type: string;
  content: string;
}

const DEMO_BLOCKS = [
  { type: "Heading", defaultContent: "Getting started with FlowCMS" },
  { type: "Rich Text", defaultContent: "Build your schema visually, deliver it instantly via REST. The industrial-editorial bridge for modern development." },
  { type: "Image", defaultContent: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" },
  { type: "CTA", defaultContent: "Start building free" },
];

export const LiveDemo = () => {
  const [selectedType, setSelectedType] = useState("Blog Post");
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [blocks, setBlocks] = useState<DemoBlock[]>([
    { id: "1", type: "Heading", content: "Getting started with FlowCMS" },
    { id: "2", type: "Rich Text", content: "Build your schema visually, deliver it instantly via REST." }
  ]);
  const [isApiPanelOpen, setIsApiPanelOpen] = useState(false); // For mobile accordion
  const [lastUpdated, setLastUpdated] = useState("just now");

  const contentTypes = ["Blog Post", "Product Page", "Case Study", "Landing Section"];
  const slug = selectedType.toLowerCase().replace(/\s+/g, "-");

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated("just now");
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    setCopied(true);
    const json = JSON.stringify(generateJson(), null, 2);
    navigator.clipboard.writeText(json);
    setTimeout(() => setCopied(false), 2000);
  };

  const addBlock = (type: string, defaultContent: string) => {
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: defaultContent
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlockContent = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    setLastUpdated("just now");
  };

  const generateJson = () => ({
    type: slug,
    status: published ? "published" : "draft",
    blocks: blocks.map(b => ({
      type: b.type.toLowerCase().replace(" ", "_"),
      content: b.content
    })),
    updatedAt: lastUpdated
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_320px] min-h-[500px] bg-paper">
      {/* Sidebar - Desktop */}
      <div className="bg-sidebar p-5 lg:border-r border-white/5 hidden lg:block">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent-bright/50 mb-2.5">Content Type</p>
        <div className="flex flex-col gap-0.5 mb-8">
          {contentTypes.map(t => (
            <button
              key={t}
              className={cn(
                "flex items-center gap-2 bg-transparent border-none cursor-pointer px-2.5 py-1.5 rounded-[3px] w-full text-left font-ui text-[13px] transition-all",
                selectedType === t 
                  ? "bg-accent-dim text-white border-l-2 border-accent-bright pl-2" 
                  : "text-white/60 hover:bg-sidebar-mid hover:text-white"
              )}
              onClick={() => { setSelectedType(t); setPublished(false); }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
              {t}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent-bright/50 mb-2.5">Add Block</p>
        <div className="flex flex-col gap-1">
          {DEMO_BLOCKS.map(b => (
            <button 
              key={b.type} 
              className="bg-transparent border border-white/10 rounded-[3px] px-2.5 py-1.5 text-left font-mono text-[11px] text-accent-bright/70 cursor-pointer transition-all hover:border-accent-bright hover:text-accent-bright hover:bg-accent-bright/5" 
              onClick={() => addBlock(b.type, b.defaultContent)}
            >
              + {b.type}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Block Picker */}
      <div className="lg:hidden bg-sidebar p-3 overflow-x-auto border-b border-white/5 flex gap-2 no-scrollbar">
        {DEMO_BLOCKS.map(b => (
          <button 
            key={b.type} 
            className="whitespace-nowrap bg-transparent border border-white/10 rounded-[3px] px-4 py-2 text-left font-mono text-[10px] text-accent-bright/70 cursor-pointer transition-all active:bg-accent-bright/5" 
            onClick={() => addBlock(b.type, b.defaultContent)}
          >
            + {b.type}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex flex-col border-r border-border">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-paper z-10">
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-ink-muted hidden sm:inline">Entries</span>
            <span className="text-ink-faint hidden sm:inline">/</span>
            <span className="font-medium text-ink">{selectedType}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border hidden xs:inline-block",
              published 
                ? "bg-success/10 text-success border-success/25" 
                : "bg-orange-500/10 text-orange-600 border-orange-500/25"
            )}>
              {published ? "Published" : "Draft"}
            </span>
            <button 
              className="font-ui text-[11px] font-bold uppercase tracking-wider bg-accent-bright text-ink border-none rounded-sm px-4 py-2 cursor-pointer transition-colors hover:bg-[#d4ff60]" 
              onClick={() => setPublished(p => !p)}
            >
              {published ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-3 bg-canvas ruled-bg min-h-[400px]">
          <AnimatePresence>
            {blocks.map((block, i) => (
              <motion.div
                key={block.id}
                className="flex flex-col bg-paper border border-border rounded-sm shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-paper/50">
                   <div className="flex items-center gap-2">
                      <GripVerticalIcon size={12} className="text-ink-faint cursor-grab" />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-accent">{block.type}</span>
                   </div>
                   <button
                    className="bg-transparent border-none cursor-pointer text-ink-faint hover:text-destructive p-1"
                    onClick={() => setBlocks(prev => prev.filter(b => b.id !== block.id))}
                  >
                    ×
                  </button>
                </div>
                <div className="p-3">
                  {block.type === "Heading" ? (
                    <input 
                      type="text" 
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      className="w-full bg-transparent border-none font-display text-lg font-semibold text-ink focus:outline-none placeholder:text-ink-faint"
                      placeholder="Enter heading..."
                    />
                  ) : block.type === "Rich Text" ? (
                    <textarea 
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      className="w-full bg-transparent border-none font-ui text-sm text-ink-muted leading-relaxed focus:outline-none min-h-[60px] resize-none"
                      placeholder="Enter body content..."
                    />
                  ) : (
                    <div className="text-[11px] font-mono text-accent truncate bg-accent/5 px-2 py-1.5 rounded-sm border border-accent/10">
                      {block.content}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {blocks.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
              <span className="font-display italic text-lg mb-2">Your canvas is empty.</span>
              <span className="text-xs">Add a block from the picker to start modeling.</span>
            </div>
          )}
        </div>
      </div>

      {/* API Panel - Desktop */}
      <div className="p-6 bg-[#0F1109] flex flex-col gap-6 hidden lg:flex overflow-hidden">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-bright/40 mb-3">API Endpoint</p>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-sm">
            <span className="font-mono text-[10px] font-bold bg-accent-bright text-ink px-1.5 py-0.5 rounded-sm shrink-0">GET</span>
            <code className="font-mono text-[11px] text-white/60 truncate">/v1/entries/{slug}</code>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">JSON Response</span>
            <button 
              className="flex items-center gap-2 bg-transparent border border-white/10 rounded-sm px-2.5 py-1.5 cursor-pointer font-mono text-[10px] text-white/60 transition-all hover:border-accent-bright hover:text-accent-bright" 
              onClick={handleCopy}
            >
              {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex-1 bg-black/40 border border-white/5 rounded-sm p-4 overflow-auto custom-scrollbar">
            <pre className="font-mono text-[11px] leading-[1.6] text-white/75 whitespace-pre">
              {JSON.stringify(generateJson(), null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Mobile API Accordion */}
      <div className="lg:hidden bg-[#0F1109] border-t border-white/5">
        <button 
          onClick={() => setIsApiPanelOpen(!isApiPanelOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-white/60 font-mono text-[11px] uppercase tracking-widest"
        >
          <span>View API Response</span>
          <ChevronDownIcon size={14} className={cn("transition-transform", isApiPanelOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {isApiPanelOpen && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden bg-black/40"
            >
              <div className="p-5">
                 <pre className="font-mono text-[11px] leading-[1.6] text-white/75 whitespace-pre-wrap">
                  {JSON.stringify(generateJson(), null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
