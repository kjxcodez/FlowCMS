"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, CopyIcon } from "./LandingIcons";
import { cn } from "@/lib/utils";

interface DemoBlock {
  id: string;
  type: string;
  label: string;
}

const DEMO_BLOCKS: DemoBlock[] = [
  { id: "b1", type: "Heading", label: "Page title or section header" },
  { id: "b2", type: "Rich Text", label: "Body copy, paragraphs, quotes" },
  { id: "b3", type: "Image", label: "Media with alt text and caption" },
  { id: "b4", type: "CTA", label: "Button with link and label" },
];

export const LiveDemo = () => {
  const [selectedType, setSelectedType] = useState("Blog Post");
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [blocks, setBlocks] = useState<DemoBlock[]>([DEMO_BLOCKS[0], DEMO_BLOCKS[1]]);

  const contentTypes = ["Blog Post", "Product Page", "Case Study", "Landing Section"];
  const slug = selectedType.toLowerCase().replace(" ", "-");

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addBlock = (block: DemoBlock) => {
    if (!blocks.find(b => b.id === block.id)) {
      setBlocks(prev => [...prev, block]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_260px] min-h-[420px] bg-paper">
      {/* Sidebar */}
      <div className="bg-sidebar p-5 lg:border-r border-white/5 hidden md:block">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent-bright/50 mb-2.5">Content Type</p>
        <div className="flex flex-col gap-0.5">
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
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent-bright/50 mt-5 mb-2.5">Add Block</p>
        <div className="flex flex-col gap-1">
          {DEMO_BLOCKS.map(b => (
            <button 
              key={b.id} 
              className="bg-transparent border border-white/10 rounded-[3px] px-2.5 py-1.5 text-left font-mono text-[11px] text-accent-bright/70 cursor-pointer transition-all hover:border-accent-bright hover:text-accent-bright hover:bg-accent-bright/5" 
              onClick={() => addBlock(b)}
            >
              + {b.type}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-paper">
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-ink-muted">Entries</span>
            <span className="text-ink-faint">/</span>
            <span className="font-medium text-ink">{selectedType}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-mono text-[11px] uppercase tracking-wide px-2.5 py-0.5 rounded-full border",
              published 
                ? "bg-success/10 text-success border-success/25" 
                : "bg-orange-500/10 text-orange-600 border-orange-500/25"
            )}>
              {published ? "Published" : "Draft"}
            </span>
            <button 
              className="font-ui text-[12px] font-medium uppercase tracking-wide bg-accent-bright text-[#18180F] border-none rounded-[3px] px-3.5 py-1.5 cursor-pointer transition-colors hover:bg-[#d4ff60]" 
              onClick={() => setPublished(p => !p)}
            >
              {published ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-2 bg-canvas ruled-bg min-h-[300px]">
          <AnimatePresence>
            {blocks.map((block, i) => (
              <motion.div
                key={block.id}
                className="flex items-center gap-3 bg-paper border border-border rounded-[3px] px-3.5 py-2.5 relative"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
              >
                <span className="font-mono text-[10px] font-medium bg-sidebar text-accent-bright px-2 py-0.5 rounded-[3px] shrink-0">{block.type}</span>
                <span className="text-[13px] text-ink-muted">{block.label}</span>
                <button
                  className="ml-auto bg-transparent border-none cursor-pointer text-ink-faint text-base leading-none px-1 transition-colors hover:text-destructive"
                  onClick={() => setBlocks(prev => prev.filter(b => b.id !== block.id))}
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {blocks.length === 0 && (
            <div className="flex-1 flex items-center justify-center font-display italic text-ink-faint text-[15px]">
              <span>Add a block from the left panel</span>
            </div>
          )}
        </div>
      </div>

      {/* API Panel */}
      <div className="p-5 lg:border-l border-border bg-[#0F1109] flex flex-col gap-4 hidden lg:flex">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent-bright/50 mb-2.5">API Endpoint</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-medium bg-accent-bright/15 text-accent-bright px-2 py-0.5 rounded-[3px]">GET</span>
            <code className="font-mono text-[11px] text-white/70 break-all">/v1/entries/{slug}</code>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">Response</span>
            <button 
              className="flex items-center gap-1.5 bg-transparent border border-white/15 rounded-[3px] px-2 py-1 cursor-pointer font-mono text-[10px] text-white/40 transition-all hover:border-accent-bright hover:text-accent-bright" 
              onClick={handleCopy}
            >
              {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="font-mono text-[11px] leading-[1.6] text-white/75 whitespace-pre-wrap overflow-auto max-h-[300px]">
{`{
  `}<span className="text-[#88C0D0]">&quot;type&quot;</span>{`: `}<span className="text-[#A8D8B9]">&quot;{slug}&quot;</span>{`,
  `}<span className="text-[#88C0D0]">&quot;status&quot;</span>{`: `}<span className={published ? "text-accent-bright" : "text-orange-500"}>&quot;{published ? "published" : "draft"}&quot;</span>{`,
  `}<span className="text-[#88C0D0]">&quot;blocks&quot;</span>{`: [`}
{blocks.map((b, i) => (
  <span key={b.id}>
    {`\n    { `}<span className="text-[#88C0D0]">&quot;type&quot;</span>{`: `}<span className="text-[#A8D8B9]">&quot;{b.type}&quot;</span>{` }`}{i < blocks.length - 1 ? "," : ""}
  </span>
))}
{`\n  ],
  `}<span className="text-[#88C0D0]">&quot;updatedAt&quot;</span>{`: `}<span className="text-[#A8D8B9]">&quot;2024-01-15T10:30:00Z&quot;</span>{`
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
