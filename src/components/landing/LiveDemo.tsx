"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, CopyIcon } from "./LandingIcons";
import { ChevronDownIcon, GripVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from "next/image";

interface DemoBlock {
  id: string;
  type: string;
  translations: Record<string, string>;
}

const DEMO_BLOCKS = [
  { type: "Heading", defaultContent: "Getting started with FlowCMS" },
  { type: "Rich Text", defaultContent: "Build your schema visually, deliver it instantly via REST." },
  { type: "Image", defaultContent: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" },
  { type: "CTA", defaultContent: "Start building free" },
  { type: "Price", defaultContent: "$49.00" },
  { type: "Gallery", defaultContent: "3 images selected" },
  { type: "Code Snippet", defaultContent: "const flow = new FlowCMS();" },
];

const JsonHighlighter = ({ data, level = 0 }: { data: any; level?: number }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const indent = "  ".repeat(level);
  
  if (data === null) return <span className="text-[#FF5252]">null</span>;
  if (typeof data === "string") return <span className="text-[#CAFF4D]">&quot;{data}&quot;</span>;
  if (typeof data === "number" || typeof data === "boolean") return <span className="text-[#F2A623]">{String(data)}</span>;
  
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-white/30">[]</span>;
    return (
      <>
        <span className="text-white/30">[</span>
        <div className="flex flex-col">
          {data.map((item, i) => (
            <div key={i} className="pl-4">
              <JsonHighlighter data={item} level={level + 1} />
              {i < data.length - 1 && <span className="text-white/30">,</span>}
            </div>
          ))}
        </div>
        <span className="text-white/30">{indent}]</span>
      </>
    );
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span className="text-white/30">{"{}"}</span>;
    return (
      <>
        <span className="text-white/30">{"{"}</span>
        <div className="flex flex-col">
          {keys.map((key, i) => (
            <div key={key} className="pl-4">
              <span className="text-[#88C0D0]">&quot;{key}&quot;</span>
              <span className="text-white/30">: </span>
              <JsonHighlighter data={data[key as keyof typeof data]} level={level + 1} />
              {i < keys.length - 1 && <span className="text-white/30">,</span>}
            </div>
          ))}
        </div>
        <span className="text-white/30">{indent}{"}"}</span>
      </>
    );
  }

  return <span>{String(data)}</span>;
};

const SortableBlock = ({ 
  block, 
  locale,
  onUpdate, 
  onDelete, 
  onCopyFromEn,
  index 
}: { 
  block: DemoBlock; 
  locale: string;
  onUpdate: (id: string, content: string) => void; 
  onDelete: (id: string) => void;
  onCopyFromEn: (id: string) => void;
  index: number;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    position: 'relative' as const,
  };

  const hasTranslation = !!block.translations[locale];
  const currentContent = block.translations[locale] || "";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col bg-paper border border-border rounded-sm shadow-sm overflow-hidden",
        isDragging && "shadow-xl border-accent-bright/50 opacity-90"
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-paper/50">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1">
              <GripVerticalIcon size={12} className="text-ink-faint" />
            </div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-accent">{block.type}</span>
            {!hasTranslation && locale !== "EN" && (
              <span className="flex items-center gap-1.5 px-1.5 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-[2px] font-mono text-[8px] uppercase font-bold tracking-tighter">
                Missing translation
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!hasTranslation && locale !== "EN" && block.translations["EN"] && (
              <button 
                onClick={() => onCopyFromEn(block.id)}
                className="font-mono text-[8px] uppercase text-accent-bright hover:underline cursor-pointer bg-transparent border-none"
              >
                Copy from EN
              </button>
            )}
            <button
              className="bg-transparent border-none cursor-pointer text-ink-faint hover:text-destructive p-1"
              onClick={() => onDelete(block.id)}
            >
              ×
            </button>
          </div>
      </div>
      <div className="p-3">
        <div className="relative group/field">
          {block.type === "Heading" || block.type === "Price" ? (
            <input 
              type="text" 
              value={currentContent}
              onChange={(e) => onUpdate(block.id, e.target.value)}
              className={cn(
                "w-full bg-transparent border-none font-display text-lg font-semibold text-ink focus:outline-none placeholder:text-ink-faint",
                !currentContent && "text-destructive"
              )}
              placeholder={`Enter ${block.type.toLowerCase()}...`}
            />
          ) : block.type === "Rich Text" || block.type === "Code Snippet" ? (
            <textarea 
              value={currentContent}
              onChange={(e) => onUpdate(block.id, e.target.value)}
              className="w-full bg-transparent border-none font-ui text-sm text-ink-muted leading-relaxed focus:outline-none min-h-[60px] resize-none"
              placeholder={`Enter ${block.type.toLowerCase()} content...`}
            />
          ) : (
            <div className="text-[11px] font-mono text-accent truncate bg-accent/5 px-2 py-1.5 rounded-sm border border-accent/10 flex items-center justify-between">
              <span>{currentContent || "No selection"}</span>
              <button className="text-[9px] text-white/20 hover:text-white uppercase transition-colors">Change</button>
            </div>
          )}
          {!currentContent && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const HighlightedText = ({ text }: { text: string }) => {
  const tokens = text.split(/(".*?"|[:{}[\]\n, ]|\btrue\b|\bfalse\b|\bnull\b|\d+)/g);
  
  return (
    <>
      {tokens.map((token, i) => {
        if (!token) return null;
        
        // Key detection: "key":
        // We look ahead in the split array if possible, but simpler is regex
        if (/^".*?"$/.test(token)) {
           // Check if it's a key (followed by colon in the original text)
           // This is a bit simplified but works for the demo
           const isKey = text.substring(text.indexOf(token) + token.length).trim().startsWith(':');
           return <span key={i} className={isKey ? "text-[#88C0D0]" : "text-[#CAFF4D]"}>{token}</span>;
        }
        if (/^(true|false|null|\d+)$/.test(token)) {
           return <span key={i} className="text-[#F2A623]">{token}</span>;
        }
        if (/^[:{}[\]\n, ]+$/.test(token)) {
           return <span key={i} className="text-white/20">{token}</span>;
        }
        return <span key={i}>{token}</span>;
      })}
    </>
  );
};

const TypewriterJson = ({ data, active }: { data: any; active: boolean }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const text = JSON.stringify(data, null, 2);
  const [revealedLength, setRevealedLength] = useState(active ? 0 : text.length);

  useEffect(() => {
    if (!active) {
      setRevealedLength(text.length);
      return;
    }

    setRevealedLength(0);
    const interval = setInterval(() => {
      setRevealedLength((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return text.length;
        }
        return prev + 1;
      });
    }, 12); // Slightly faster than 18ms for better feel

    return () => clearInterval(interval);
  }, [text, active]);

  return (
    <pre className="font-mono text-[11px] leading-[1.6] text-white/75 whitespace-pre overflow-hidden">
      <HighlightedText text={text.slice(0, revealedLength)} />
      {revealedLength < text.length && <span className="animate-pulse border-l border-accent-bright ml-0.5" />}
    </pre>
  );
};

export const LiveDemo = () => {
  const [selectedCollection, setSelectedCollection] = useState("Blog Post");
  const [activeTab, setActiveTab] = useState<"content" | "schema">("content");
  const [locale, setLocale] = useState("EN");
  const [showLocaleDropdown, setShowLocaleDropdown] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState(38);
  const [isPulsing, setIsPulsing] = useState(false);
  const [statusLabel, setStatusLabel] = useState("JSON Response");
  const [blocks, setBlocks] = useState<DemoBlock[]>([
    { id: "1", type: "Heading", translations: { EN: "Getting started with FlowCMS" } },
    { id: "2", type: "Rich Text", translations: { EN: "Build your schema visually, deliver it instantly via REST." } }
  ]);
  const [isApiPanelOpen, setIsApiPanelOpen] = useState(false); // For mobile accordion
  const [lastUpdated, setLastUpdated] = useState("just now");

  const schemaDefinitions: Record<string, any[]> = { // eslint-disable-line @typescript-eslint/no-explicit-any
    "Blog Post": [
      { name: "Title", type: "Heading", required: true },
      { name: "Body", type: "Rich Text", required: true },
      { name: "Cover Image", type: "Image", required: false },
      { name: "Author", type: "Heading", required: false },
      { name: "Tags", type: "Rich Text", required: false },
    ],
    "Product Page": [
      { name: "Name", type: "Heading", required: true },
      { name: "Description", type: "Rich Text", required: true },
      { name: "Price", type: "Price", required: true },
      { name: "Gallery", type: "Gallery", required: false },
      { name: "CTA", type: "CTA", required: false },
    ],
    "Docs Article": [
      { name: "Title", type: "Heading", required: true },
      { name: "Body", type: "Rich Text", required: true },
      { name: "Code Snippet", type: "Code Snippet", required: false },
      { name: "Related Links", type: "Rich Text", required: false },
    ],
    "Landing Section": [
      { name: "Headline", type: "Heading", required: true },
      { name: "Subheading", type: "Rich Text", required: false },
      { name: "CTA", type: "CTA", required: false },
      { name: "Background", type: "Image", required: false },
    ],
    "Press Release": [
      { name: "Headline", type: "Heading", required: true },
      { name: "Dateline", type: "Rich Text", required: true },
      { name: "Body", type: "Rich Text", required: true },
      { name: "Contact", type: "Rich Text", required: false },
    ],
    "Changelog Entry": [
      { name: "Version", type: "Heading", required: true },
      { name: "Date", type: "Heading", required: true },
      { name: "Summary", type: "Rich Text", required: true },
      { name: "Breaking", type: "CTA", required: false },
    ]
  };

  const handleCollectionChange = (collection: string) => {
    setSelectedCollection(collection);
    setPublished(false);
    
    // Pre-populate blocks based on type
    const presets: Record<string, DemoBlock[]> = {
      "Blog Post": [
        { id: "1", type: "Heading", translations: { EN: "Getting started with FlowCMS" } },
        { id: "2", type: "Rich Text", translations: { EN: "Build your schema visually, deliver it instantly via REST." } }
      ],
      "Product Page": [
        { id: "1", type: "Heading", translations: { EN: "FlowCMS Enterprise" } },
        { id: "2", type: "Rich Text", translations: { EN: "The only CMS built for industrial-scale content distribution." } },
        { id: "3", type: "Price", translations: { EN: "$499/mo" } }
      ],
      "Docs Article": [
        { id: "1", type: "Heading", translations: { EN: "API Authentication" } },
        { id: "2", type: "Rich Text", translations: { EN: "Learn how to secure your API calls using FlowCMS bearer tokens." } },
        { id: "3", type: "Code Snippet", translations: { EN: "curl -X GET https://api.flowcms.com/v1/entries/blog-post" } }
      ],
      "Landing Section": [
        { id: "1", type: "Heading", translations: { EN: "Ready to go flow?" } },
        { id: "2", type: "CTA", translations: { EN: "Get Started" } }
      ],
      "Press Release": [
        { id: "1", type: "Heading", translations: { EN: "FlowCMS Announces Series A" } },
        { id: "2", type: "Rich Text", translations: { EN: "San Francisco, CA — Today we are excited to share..." } }
      ],
      "Changelog Entry": [
        { id: "1", type: "Heading", translations: { EN: "v1.2.0" } },
        { id: "2", type: "Heading", translations: { EN: "May 10, 2026" } },
        { id: "3", type: "Rich Text", translations: { EN: "Added multi-locale support and schema-aware canvas." } }
      ]
    };
    
    setBlocks(presets[collection] || presets["Blog Post"]);
    triggerPulse();
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      triggerPulse();
    }
  };

  const collections = ["Blog Post", "Product Page", "Docs Article", "Landing Section", "Press Release", "Changelog Entry"];
  const collectionSlug = selectedCollection.toLowerCase().replace(/\s+/g, "-");

  const triggerPulse = () => {
    setIsPulsing(true);
    setLatency(Math.floor(Math.random() * (52 - 28 + 1) + 28));
    setStatusLabel("Response updated");
    setTimeout(() => setIsPulsing(false), 600);
    setTimeout(() => setStatusLabel("JSON Response"), 1500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated("just now");
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text?: string) => {
    setCopied(true);
    const content = text || JSON.stringify(generateJson(), null, 2);
    navigator.clipboard.writeText(content);
    setTimeout(() => setCopied(false), 2000);
  };

  const addBlock = (type: string, defaultContent: string) => {
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      translations: { [locale]: defaultContent }
    };
    setBlocks(prev => [...prev, newBlock]);
    triggerPulse();
  };

  const updateBlockContent = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, translations: { ...b.translations, [locale]: content } } : b));
    setLastUpdated("just now");
    triggerPulse();
  };

  const copyFromEn = (id: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, translations: { ...b.translations, [locale]: b.translations["EN"] || "" } };
      }
      return b;
    }));
    triggerPulse();
  };

  const generateJson = () => ({
    collection: collectionSlug,
    status: published ? "published" : "draft",
    locale: locale.toLowerCase(),
    blocks: blocks.map(b => {
      const hasTranslation = !!b.translations[locale];
      return {
        type: b.type.toLowerCase().replace(" ", "_"),
        content: hasTranslation ? b.translations[locale] : b.translations["EN"] || null,
        ...( !hasTranslation && b.translations["EN"] ? { fallback: true } : {} )
      };
    }),
    updatedAt: lastUpdated
  });

  const schemaForCollection = schemaDefinitions[selectedCollection] || [];
  const allowedBlockTypes = new Set(schemaForCollection.map(f => f.type));
  const missingRequiredFields = schemaForCollection
    .filter(f => f.required && !blocks.some(b => b.type === f.type))
    .map(f => f.name);

  const hasValidationErrors = blocks.some(b => {
    const isRequiredInSchema = schemaForCollection.some(f => f.type === b.type && f.required);
    return isRequiredInSchema && !b.translations[locale] && !b.translations["EN"];
  }) || missingRequiredFields.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] min-h-[500px] bg-paper">
      {/* Sidebar - Desktop */}
      <div className="bg-sidebar p-5 lg:border-r border-white/5 hidden lg:block overflow-y-auto">
        <div className="flex gap-1 bg-white/5 p-1 rounded-sm mb-6 border border-white/5">
          <button 
            onClick={() => setActiveTab("content")}
            className={cn(
              "flex-1 px-2 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-wider transition-all",
              activeTab === "content" ? "bg-accent-bright text-ink font-bold shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            Collections
          </button>
          <button 
            onClick={() => setActiveTab("schema")}
            className={cn(
              "flex-1 px-2 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-wider transition-all",
              activeTab === "schema" ? "bg-accent-bright text-ink font-bold shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            Schema
          </button>
        </div>

        {activeTab === "content" ? (
          <>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent-bright/50 mb-2.5">Collection</p>
            <div className="flex flex-col gap-0.5 mb-8">
              {collections.map(t => (
                <button
                  key={t}
                  className={cn(
                    "flex items-center gap-2 bg-transparent border-none cursor-pointer px-2.5 py-1.5 rounded-[3px] w-full text-left font-ui text-[13px] transition-all",
                    selectedCollection === t 
                      ? "bg-accent-dim text-white border-l-2 border-accent-bright pl-2" 
                      : "text-white/60 hover:bg-sidebar-mid hover:text-white"
                  )}
                  onClick={() => handleCollectionChange(t)}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                  {t}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent-bright/50 mb-2.5">Add Block</p>
            <div className="flex flex-col gap-1">
              {DEMO_BLOCKS.map(b => {
                const isAllowed = allowedBlockTypes.has(b.type);
                return (
                  <button 
                    key={b.type} 
                    disabled={!isAllowed}
                    className={cn(
                      "bg-transparent border rounded-[3px] px-2.5 py-1.5 text-left font-mono text-[11px] transition-all relative group",
                      isAllowed 
                        ? "border-white/10 text-accent-bright/70 cursor-pointer hover:border-accent-bright hover:text-accent-bright hover:bg-accent-bright/5" 
                        : "border-white/5 text-white/10 cursor-not-allowed opacity-50"
                    )}
                    onClick={() => addBlock(b.type, b.defaultContent)}
                  >
                    + {b.type}
                    {!isAllowed && (
                      <span className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-white/20">Not in schema</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
             <div className="pb-3 border-b border-white/10">
                <p className="font-mono text-[10px] text-accent-bright/50 uppercase tracking-widest mb-1">{selectedCollection} Schema</p>
                <div className="h-0.5 w-8 bg-accent-bright/30" />
             </div>
             <div className="flex flex-col gap-3">
                {schemaDefinitions[selectedCollection].map((field, i) => (
                  <div key={i} className="group flex flex-col gap-1.5 p-2 rounded-sm border border-white/5 bg-white/5 transition-all hover:border-accent-bright/20">
                     <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-white/80 font-medium">{field.name}</span>
                        {field.required && <span className="text-[9px] font-mono text-destructive uppercase tracking-tighter">Required</span>}
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-[1px] bg-accent-bright/40" />
                        <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">{field.type}</span>
                     </div>
                  </div>
                ))}
                <button className="mt-2 border border-dashed border-white/10 rounded-sm py-2 font-mono text-[10px] text-white/20 hover:text-accent-bright hover:border-accent-bright transition-all cursor-pointer">
                  + Add field
                </button>
             </div>
          </div>
        )}
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
            <span className="font-medium text-ink">{selectedCollection}</span>
            <div className="relative ml-2">
              <button 
                onClick={() => setShowLocaleDropdown(!showLocaleDropdown)}
                className="px-1.5 py-0.5 rounded border border-border text-[10px] font-bold text-accent hover:bg-accent/5 cursor-pointer flex items-center gap-1 transition-colors"
              >
                {locale} <ChevronDownIcon size={10} className={cn("transition-transform", showLocaleDropdown && "rotate-180")} />
              </button>
              <AnimatePresence>
                {showLocaleDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full left-0 mt-1 bg-paper border border-border shadow-xl rounded-sm py-1 min-w-[60px] z-20"
                  >
                    {["EN", "FR", "DE", "HI"].map(l => (
                      <button
                        key={l}
                        className={cn(
                          "w-full text-left px-3 py-1.5 font-mono text-[10px] hover:bg-accent/5 transition-colors",
                          locale === l ? "text-accent font-bold" : "text-ink-muted"
                        )}
                        onClick={() => {
                          setLocale(l);
                          setShowLocaleDropdown(false);
                          triggerPulse();
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-sm border transition-all flex items-center gap-2",
                isPreviewOpen 
                  ? "bg-accent-bright text-ink border-accent-bright font-bold" 
                  : "bg-transparent text-ink-muted border-border hover:border-accent-bright hover:text-accent-bright"
              )}
            >
              <span className={cn("size-1.5 rounded-full", isPreviewOpen ? "bg-ink animate-pulse" : "bg-ink-muted")} />
              Preview
            </button>
            <AnimatePresence>
              {hasValidationErrors && (
                <motion.span 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="font-mono text-[9px] text-destructive flex items-center gap-1 bg-destructive/5 px-2 py-1 rounded-sm border border-destructive/10"
                >
                  ⚠ validation error
                </motion.span>
              )}
            </AnimatePresence>
            <span className={cn(
              "font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border hidden xs:inline-block",
              published 
                ? "bg-success/10 text-success border-success/25" 
                : "bg-orange-500/10 text-orange-600 border-orange-500/25"
            )}>
              {published ? "Published" : "Draft"}
            </span>
            <button 
              disabled={hasValidationErrors}
              className={cn(
                "font-ui text-[11px] font-bold uppercase tracking-wider rounded-sm px-4 py-2 cursor-pointer transition-all",
                hasValidationErrors 
                  ? "bg-border text-ink-faint cursor-not-allowed opacity-50" 
                  : "bg-accent-bright text-ink border-none hover:bg-[#d4ff60]"
              )}
              onClick={() => setPublished(p => !p)}
            >
              {published ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-3 bg-canvas ruled-bg min-h-[400px] relative">
          <AnimatePresence>
            {missingRequiredFields.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="bg-destructive/10 border border-destructive/20 rounded-sm px-4 py-2 flex items-center justify-between">
                  <p className="font-mono text-[10px] text-destructive uppercase tracking-wider">
                    ⚠ {missingRequiredFields.length} required field{missingRequiredFields.length > 1 ? "s" : ""} missing: {missingRequiredFields.join(", ")}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {blocks.map((block, i) => (
                  <SortableBlock 
                    key={block.id}
                    block={block}
                    locale={locale}
                    index={i}
                    onUpdate={updateBlockContent}
                    onDelete={(id) => setBlocks(prev => prev.filter(b => b.id !== id))}
                    onCopyFromEn={copyFromEn}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
          {blocks.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
              <span className="font-display italic text-lg mb-2">Your canvas is empty.</span>
              <span className="text-xs">Add a block from the picker to start modeling.</span>
            </div>
          )}

          {/* Entry Metadata Strip */}
          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-[10px] font-mono text-ink-faint uppercase tracking-wider">
             <div className="flex items-center gap-3">
                <span>Last saved: just now</span>
                <span>•</span>
                <span>v3</span>
                <span>•</span>
                <span>by you</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success opacity-50" />
                <span>Live on Edge</span>
             </div>
          </div>

          {/* Preview Overlay */}
          <AnimatePresence>
            {isPreviewOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-canvas/80 backdrop-blur-md p-8 overflow-auto"
              >
                <div className="max-w-2xl mx-auto bg-paper shadow-2xl rounded-sm border border-border overflow-hidden min-h-full">
                  {/* Fake Browser Chrome */}
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-paper/50">
                     <div className="size-2 rounded-full bg-border" />
                     <div className="size-2 rounded-full bg-border" />
                     <div className="size-2 rounded-full bg-border" />
                     <div className="ml-4 flex-1 h-5 rounded-sm bg-border/20 flex items-center px-3">
                        <span className="font-mono text-[9px] text-ink-faint">https://your-site.com/{collectionSlug}</span>
                     </div>
                  </div>
                  <div className="p-10 flex flex-col gap-8">
                     {blocks.map(block => {
                        const content = block.translations[locale] || block.translations["EN"] || "";
                        return (
                          <div key={block.id}>
                             {block.type === "Heading" && (
                                <h1 className="font-display text-4xl font-bold text-ink leading-tight">
                                  {content || "Untitled"}
                                </h1>
                             )}
                             {block.type === "Rich Text" && (
                                <p className="font-ui text-lg text-ink-muted leading-relaxed">
                                  {content || "..."}
                                </p>
                             )}
                             {block.type === "Image" && (
                                <div className="aspect-video w-full bg-accent/5 rounded-sm overflow-hidden border border-accent/10 relative">
                                   <Image src={content} alt={content} className="size-full object-cover grayscale" />
                                </div>
                             )}
                             {block.type === "CTA" && (
                                <button className="bg-accent text-paper font-ui font-bold uppercase tracking-wider px-8 py-4 rounded-sm hover:scale-[1.02] transition-transform">
                                  {content || "Click here"}
                                </button>
                             )}
                          </div>
                        );
                     })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* API Panel - Desktop */}
      <div className="p-6 bg-[#0F1109] flex flex-col gap-6 hidden lg:flex overflow-hidden">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-bright/40 mb-3">API Endpoint</p>
          <div className="group flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-sm transition-colors hover:border-white/20">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-mono text-[10px] font-bold bg-accent-bright text-ink px-1.5 py-0.5 rounded-sm shrink-0">GET</span>
              <code className="font-mono text-[11px] text-white/60 truncate">/v1/entries/{collectionSlug}</code>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <button 
                 onClick={() => handleCopy(`https://api.getflowcms.com/v1/entries/${collectionSlug}`)}
                 className="p-1 text-white/20 hover:text-accent-bright transition-colors cursor-pointer bg-transparent border-none"
                 title="Copy full URL"
               >
                 {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
               </button>
               <a href="#" className="font-mono text-[9px] text-accent-bright/50 hover:text-accent-bright underline decoration-accent-bright/30">Try it →</a>
            </div>
          </div>
        </div>

        {/* Response Metadata Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm font-mono text-[10px] text-white/40">
           <div className="flex items-center gap-3">
             <span className="text-success font-bold">200 OK</span>
             <span>application/json</span>
           </div>
           <div className="flex items-center gap-3">
             <span>~1.2kb</span>
             <span className="text-accent-bright/70">{latency}ms</span>
           </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
           {/* Request Headers Section */}
           <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                 <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Request Headers</p>
                 <button 
                   onClick={() => handleCopy(`curl -X GET https://getflowcms.com/api/v1/entries/${collectionSlug} \\\n  -H "Authorization: Bearer fl_live_••••••••••••" \\\n  -H "X-API-Version: 1"`)}
                   className="font-mono text-[9px] text-accent-bright/50 hover:text-accent-bright uppercase tracking-tighter cursor-pointer bg-transparent border-none"
                 >
                    Copy curl
                 </button>
              </div>
              <div className="bg-white/5 rounded-sm p-3 border border-white/5 flex flex-col gap-1.5 font-mono text-[10px]">
                 <div className="flex items-center justify-between">
                    <span className="text-white/40">Authorization</span>
                    <span className="text-white/70 italic">Bearer fl_live_••••••••••••</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-white/40">X-API-Version</span>
                    <span className="text-white/70">1</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <div className={cn(
                 "w-1.5 h-1.5 rounded-full bg-success",
                 isPulsing && "animate-ping"
               )} />
               <span className={cn(
                 "font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
                 statusLabel === "Response updated" ? "text-success" : "text-white/20"
               )}>
                 {statusLabel}
               </span>
             </div>
             <button 
               className="flex items-center gap-2 bg-transparent border border-white/10 rounded-sm px-2.5 py-1.5 cursor-pointer font-mono text-[10px] text-white/60 transition-all hover:border-accent-bright hover:text-accent-bright" 
               onClick={() => handleCopy()}
             >
               {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
               {copied ? "Copied" : "Copy"}
             </button>
           </div>
           <div className="flex-1 bg-black/40 border border-white/5 rounded-sm p-4 overflow-auto custom-scrollbar">
             <TypewriterJson data={generateJson()} active={isPulsing} />
           </div>
        </div>
      </div>

      {/* Mobile API Accordion */}
      <div className="lg:hidden bg-[#0F1109] border-t border-white/5">
        <button 
          onClick={() => setIsApiPanelOpen(!isApiPanelOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-white/60 font-mono text-[11px] uppercase tracking-widest"
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full bg-success",
              isPulsing && "animate-ping"
            )} />
            <span>{statusLabel === "Response updated" ? "Response updated" : "View API Response"}</span>
          </div>
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
              <div className="px-5 pb-5 pt-2 border-t border-white/5">
                 <div className="flex items-center justify-between mb-4 font-mono text-[9px] text-white/30 uppercase">
                    <span>200 OK</span>
                    <span>{latency}ms</span>
                 </div>
                 <TypewriterJson data={generateJson()} active={isPulsing} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
