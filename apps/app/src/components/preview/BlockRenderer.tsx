import React from "react";
import { Block } from "@/types/cms";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-16 py-12">
      {blocks.map((block) => (
        <section key={block.id} className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {renderBlock(block)}
        </section>
      ))}
    </div>
  );
}

function renderBlock(block: Block) {
  const { type, props } = block;

  switch (type) {
    case "heading": {
      const Level = (props.level as "h1" | "h2" | "h3") || "h2";
      return (
        <div className="max-w-4xl mx-auto">
          <Level className={cn(
            "font-display font-semibold text-ink tracking-tight",
            Level === "h1" ? "text-5xl md:text-7xl mb-8" : 
            Level === "h2" ? "text-4xl md:text-5xl mb-6" : 
            "text-2xl md:text-3xl mb-4"
          )}>
            {props.text as string}
          </Level>
        </div>
      );
    }
    case "text":
      return (
        <div className="max-w-3xl mx-auto">
          <p className="text-lg md:text-xl text-ink-muted leading-relaxed font-light whitespace-pre-wrap">
            {props.text as string}
          </p>
        </div>
      );
    case "image":
      return (
        <div className="max-w-5xl mx-auto">
          <figure className="space-y-4">
            <div className="rounded-sm overflow-hidden border border-border-strong/10 bg-canvas shadow-2xl">
              <Image src={props.url as string} alt={props.alt as string} className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
            </div>
            {Boolean(props.alt) && (
              <figcaption className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                {"// "}{props.alt as string}
              </figcaption>
            )}
          </figure>
        </div>
      );
    case "cta":
      return (
        <div className="max-w-3xl mx-auto flex justify-center">
          <Button asChild size="lg" className="h-14 px-12 text-[11px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-xl hover:scale-105 transition-all">
            <a href={props.url as string} target="_blank" rel="noopener noreferrer">
              {props.label as string}
            </a>
          </Button>
        </div>
      );
    case "quote":
      return (
        <div className="max-w-4xl mx-auto">
          <blockquote className="relative p-12 border-l-4 border-accent bg-accent/5 rounded-sm italic">
            <div className="absolute top-4 left-8 text-6xl text-accent opacity-20 font-display">“</div>
            <p className="text-2xl md:text-3xl font-display font-medium text-ink leading-relaxed mb-6">
              {props.text as string}
            </p>
            {Boolean(props.author) && (
              <cite className="not-italic font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                — {props.author as string}
              </cite>
            )}
          </blockquote>
        </div>
      );
    case "code":
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-sidebar rounded-sm border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="size-2 rounded-full bg-red-500/50" />
                <div className="size-2 rounded-full bg-amber-500/50" />
                <div className="size-2 rounded-full bg-emerald-500/50" />
              </div>
              <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">{props.language as string}</span>
            </div>
            <pre className="p-8 overflow-x-auto">
              <code className="font-mono text-sm text-white/80 leading-relaxed">
                {props.code as string}
              </code>
            </pre>
          </div>
        </div>
      );
    case "callout": {
      const type = (props.type as string) || "info";
      const colors = {
        info: "border-accent bg-accent/5",
        warning: "border-amber-500/50 bg-amber-500/5",
        success: "border-emerald-500/50 bg-emerald-500/5",
        error: "border-red-500/50 bg-red-500/5",
      };
      return (
        <div className="max-w-3xl mx-auto">
          <div className={cn("p-8 border-2 rounded-sm relative overflow-hidden", colors[type as keyof typeof colors])}>
            <p className="text-lg font-medium text-ink relative z-10">
              {props.text as string}
            </p>
            <div className="absolute inset-0 noise-overlay opacity-5 pointer-events-none" />
          </div>
        </div>
      );
    }
    case "divider":
      return (
        <div className="max-w-2xl mx-auto py-8">
          <div className="h-px bg-border-strong/10 w-full" />
        </div>
      );
    case "accordion":
      return (
        <div className="max-w-3xl mx-auto">
          <div className="border border-border rounded-sm overflow-hidden bg-paper shadow-sm">
            <div className="px-8 py-5 border-b border-border bg-canvas/30">
              <h4 className="font-display text-base font-semibold text-ink uppercase tracking-wider">{props.title as string}</h4>
            </div>
            <div className="p-8">
              <p className="text-ink-muted leading-relaxed font-light">{props.content as string}</p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
