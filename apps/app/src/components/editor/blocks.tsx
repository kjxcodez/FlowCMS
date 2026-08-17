import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

interface BlockProps {
  props: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export const HeadingBlock = ({ props, onChange }: BlockProps) => (
  <div className="space-y-3">
    <Input 
      value={(props.text as string) || ""}
      onChange={(e) => onChange({ ...props, text: e.target.value })}
      placeholder="Heading text..."
      className="bg-transparent border-none p-0 text-2xl font-display font-semibold text-ink shadow-none focus-visible:ring-0"
    />
    <Select 
      value={(props.level as string) || "h2"}
      onValueChange={(value) => onChange({ ...props, level: value })}
    >
      <SelectTrigger size="sm" className="w-fit min-w-24 font-mono text-[10px] uppercase tracking-widest">
        <SelectValue placeholder="Level" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="h1">Level 1</SelectItem>
        <SelectItem value="h2">Level 2</SelectItem>
        <SelectItem value="h3">Level 3</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export const TextBlock = ({ props, onChange }: BlockProps) => (
  <Textarea 
    value={(props.text as string) || ""}
    onChange={(e) => onChange({ ...props, text: e.target.value })}
    placeholder="Start typing content..."
    className="bg-transparent border-none p-0 text-sm leading-relaxed text-ink-muted shadow-none focus-visible:ring-0 min-h-[40px] resize-none"
  />
);

export const ImageBlock = ({ props, onChange }: BlockProps) => (
  <div className="space-y-4">
    {props.url ? (
      <div className="relative aspect-video bg-canvas rounded overflow-hidden border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={props.url as string} alt={(props.alt as string) || ""} className="object-cover w-full h-full" />
        <button 
          onClick={() => onChange({ ...props, url: "" })}
          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors border-none cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    ) : (
      <div className="aspect-video bg-canvas border-2 border-dashed border-border rounded flex flex-col items-center justify-center gap-2 text-ink-faint">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline bg-transparent border-none cursor-pointer">Select Image</button>
      </div>
    )}
    <Input 
      value={(props.alt as string) || ""}
      onChange={(e) => onChange({ ...props, alt: e.target.value })}
      placeholder="Alt text..."
      className="bg-transparent border-none border-b border-border rounded-none p-0 text-[10px] font-mono uppercase tracking-wider text-ink-muted shadow-none focus-visible:ring-0 h-auto pb-1"
    />
  </div>
);

export const CtaBlock = ({ props, onChange }: BlockProps) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-1.5">
      <Label className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint ml-0.5">Label</Label>
      <Input 
        value={(props.label as string) || ""}
        onChange={(e) => onChange({ ...props, label: e.target.value })}
        className="text-xs h-8 bg-canvas border-border"
        placeholder="Button label"
      />
    </div>
    <div className="space-y-1.5">
      <Label className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint ml-0.5">Link</Label>
      <Input 
        value={(props.url as string) || ""}
        onChange={(e) => onChange({ ...props, url: e.target.value })}
        className="text-xs h-8 bg-canvas border-border"
        placeholder="https://..."
      />
    </div>
  </div>
);

export const QuoteBlock = ({ props, onChange }: BlockProps) => (
  <div className="pl-6 border-l-2 border-accent italic space-y-3 py-1">
    <Textarea 
      value={(props.text as string) || ""}
      onChange={(e) => onChange({ ...props, text: e.target.value })}
      placeholder="Enter quote..."
      className="bg-transparent border-none p-0 text-xl leading-relaxed text-ink shadow-none focus-visible:ring-0 min-h-[40px] resize-none font-display font-medium"
    />
    <Input 
      value={(props.author as string) || ""}
      onChange={(e) => onChange({ ...props, author: e.target.value })}
      placeholder="Author..."
      className="bg-transparent border-none p-0 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted shadow-none focus-visible:ring-0 h-auto font-bold"
    />
  </div>
);

export const CodeBlock = ({ props, onChange }: BlockProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Select 
        value={(props.language as string) || "typescript"}
        onValueChange={(value) => onChange({ ...props, language: value })}
      >
        <SelectTrigger size="sm" className="w-fit min-w-[120px] h-7 font-mono text-[9px] uppercase tracking-widest bg-sidebar text-white border-none rounded-none">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="bg-sidebar text-white border-border rounded-none">
          <SelectItem value="typescript">TypeScript</SelectItem>
          <SelectItem value="javascript">JavaScript</SelectItem>
          <SelectItem value="html">HTML</SelectItem>
          <SelectItem value="css">CSS</SelectItem>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="python">Python</SelectItem>
          <SelectItem value="rust">Rust</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="relative">
      <Textarea 
        value={(props.code as string) || ""}
        onChange={(e) => onChange({ ...props, code: e.target.value })}
        placeholder="// Paste code here..."
        className="font-mono text-xs bg-sidebar text-white border-none p-6 rounded-none min-h-[160px] focus-visible:ring-1 focus-visible:ring-accent leading-relaxed"
      />
      <div className="absolute inset-0 pointer-events-none noise-overlay opacity-10" />
    </div>
  </div>
);

export const CalloutBlock = ({ props, onChange }: BlockProps) => {
  const type = (props.type as string) || "info";
  const colors = {
    info: "border-accent bg-accent/5",
    warning: "border-amber-500 bg-amber-500/5",
    success: "border-emerald-500 bg-emerald-500/5",
    error: "border-red-500 bg-red-500/5",
  };
  
  return (
    <div className={cn("p-6 border-2 rounded-none space-y-3 relative overflow-hidden", colors[type as keyof typeof colors])}>
      <div className="flex items-center justify-between relative z-10">
         <Select 
          value={type}
          onValueChange={(value) => onChange({ ...props, type: value })}
        >
          <SelectTrigger size="sm" className="w-fit h-6 font-mono text-[8px] uppercase tracking-widest border-none bg-white/40 rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea 
        value={(props.text as string) || ""}
        onChange={(e) => onChange({ ...props, text: e.target.value })}
        placeholder="Callout message..."
        className="bg-transparent border-none p-0 text-sm font-medium text-ink shadow-none focus-visible:ring-0 min-h-[24px] resize-none relative z-10"
      />
      <div className="absolute inset-0 pointer-events-none noise-overlay opacity-5" />
    </div>
  );
};

export const AccordionBlock = ({ props, onChange }: BlockProps) => (
  <div className="border-2 border-border rounded-none overflow-hidden bg-paper">
    <div className="bg-muted px-5 py-3 border-b-2 border-border">
      <Input 
        value={(props.title as string) || ""}
        onChange={(e) => onChange({ ...props, title: e.target.value })}
        placeholder="Accordion Title..."
        className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.2em] text-ink shadow-none focus-visible:ring-0 h-auto"
      />
    </div>
    <div className="p-5">
       <Textarea 
        value={(props.content as string) || ""}
        onChange={(e) => onChange({ ...props, content: e.target.value })}
        placeholder="Accordion content..."
        className="bg-transparent border-none p-0 text-sm leading-relaxed text-ink-muted shadow-none focus-visible:ring-0 min-h-[40px] resize-none"
      />
    </div>
  </div>
);
