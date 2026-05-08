import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
