"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useEntry } from "@/hooks/use-entries";
import { useCollection } from "@/hooks/use-collections";
import { BlockRenderer } from "@/components/preview/BlockRenderer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Smartphone, Globe, Shield, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function EntryPreviewPage() {
  const { collectionId, entryId } = useParams() as { collectionId: string; entryId: string };
  const router = useRouter();
  const { data: entry, isLoading: entryLoading } = useEntry(entryId);
  const { data: collection } = useCollection(collectionId);
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");

  if (entryLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-canvas font-mono space-y-4">
        <Activity className="size-6 text-accent animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-ink-faint">Reticulating Splines...</p>
      </div>
    );
  }

  if (!entry) return <div className="p-20 text-center">Entry not found</div>;

  const data = entry.data as any;
  const blocks = data.blocks || [];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Bar / Controls */}
      <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-border px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="size-10 rounded-full hover:bg-canvas transition-all"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-display font-semibold text-sm">{data.title || entry.slug}</span>
              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest h-4 px-1.5 border-accent/20 text-accent bg-accent/5">
                Preview
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">
              {collection?.name} / {entry.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-canvas p-1 rounded-sm border border-border shadow-inner">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDevice("desktop")}
            className={cn(
              "h-9 px-4 rounded-xs transition-all",
              device === "desktop" ? "bg-paper text-accent shadow-sm" : "text-ink-faint"
            )}
          >
            <Monitor className="size-4 mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Desktop</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDevice("mobile")}
            className={cn(
              "h-9 px-4 rounded-xs transition-all",
              device === "mobile" ? "bg-paper text-accent shadow-sm" : "text-ink-faint"
            )}
          >
            <Smartphone className="size-4 mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mobile</span>
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 px-6 border-r border-border">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint">Status</span>
              <span className="text-[11px] font-semibold text-success">{entry.status}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint">Security</span>
              <span className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                <Shield className="size-3 text-accent" />
                Live API
              </span>
            </div>
          </div>
          <Button asChild className="h-11 px-8 text-[11px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-xl">
             <a href={`/api/v1/entries/${collection?.slug}/${entry.slug}`} target="_blank">
               <Globe className="size-4 mr-2.5" />
               Raw Payload
             </a>
          </Button>
        </div>
      </nav>

      {/* Preview Container */}
      <main className="flex-1 overflow-auto p-12 bg-canvas noise-overlay-light">
        <div className={cn(
          "mx-auto bg-white border border-border-strong/10 shadow-[0_40px_100px_rgba(0,0,0,0.1)] transition-all duration-700 ease-in-out overflow-hidden",
          device === "desktop" ? "max-w-7xl min-h-[1000px] rounded-sm" : "max-w-[400px] min-h-[800px] rounded-[3rem] border-[12px] border-sidebar shadow-2xl"
        )}>
          {/* Virtual Browser Chrome */}
          {device === "desktop" && (
            <div className="h-12 bg-canvas/50 border-b border-border flex items-center px-6 gap-2">
               <div className="flex gap-1.5">
                 <div className="size-2.5 rounded-full bg-border-strong/20" />
                 <div className="size-2.5 rounded-full bg-border-strong/20" />
                 <div className="size-2.5 rounded-full bg-border-strong/20" />
               </div>
               <div className="flex-1 mx-8 h-7 bg-paper rounded-full border border-border flex items-center px-4 font-mono text-[9px] text-ink-faint">
                 https://{collection?.slug || "api"}.flowcms.com/{entry.slug}
               </div>
            </div>
          )}

          <div className={cn(
            "relative",
            device === "mobile" ? "h-[800px] overflow-auto scrollbar-hide" : ""
          )}>
             {/* Content */}
             <div className="bg-white text-ink min-h-screen">
                <div className="max-w-5xl mx-auto px-8 py-20">
                  <BlockRenderer blocks={blocks} />
                </div>
                
                {/* Visual Footer Placeholder */}
                <footer className="py-20 border-t border-border mt-32">
                   <div className="max-w-5xl mx-auto px-8 text-center space-y-8">
                      <div className="size-12 bg-accent/10 rounded-sm mx-auto flex items-center justify-center">
                        <Globe className="size-6 text-accent" />
                      </div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-ink-faint">
                        Proudly Powered by FlowCMS
                      </p>
                   </div>
                </footer>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
