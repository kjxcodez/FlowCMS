"use client";

import React, { useState } from "react";
import { 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles,
  ArrowRight,
  Code2,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useCollections } from "@/hooks/use-collections";
import Link from "next/link";
import { getApiBaseUrl } from "@/config/app";

export function QuickstartGuide() {
  const { data: apiKeys } = useApiKeys();
  const { data: collections } = useCollections();
  const [copied, setCopied] = useState(false);

  const originUrl = getApiBaseUrl();
  const apiKey = apiKeys?.[0]?.key || "YOUR_API_KEY";
  const collectionSlug = collections?.[0]?.slug || "starter-collection";
  
  const fetchCode = `fetch('${originUrl}/api/v1/entries/${collectionSlug}/hello-world', {
  headers: {
    'Authorization': 'Bearer ${apiKey}'
  }
})
.then(res => res.json())
.then(data => console.log(data));`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fetchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Sparkles className="size-5 text-accent" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold text-ink">Aha! Moment</h3>
          <p className="text-sm text-ink-muted font-light">Your infrastructure is live. Let&apos;s fetch your first entry.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-paper border-border rounded-sm shadow-sm overflow-hidden border-l-4 border-l-accent">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Terminal className="size-4 text-accent" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Step 01: Test the Uplink</span>
              </div>
              <p className="text-sm text-ink font-light leading-relaxed">
                We&apos;ve auto-provisioned a <span className="font-semibold text-accent">Hello World</span> entry and a <span className="font-semibold text-accent">Development Key</span> for you. Use the snippet below to verify your API connection.
              </p>
              
              <div className="relative group">
                <pre className="bg-canvas p-6 rounded-sm border border-border font-mono text-[11px] leading-relaxed text-ink-muted overflow-x-auto whitespace-pre">
                  {fetchCode}
                </pre>
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 p-2 rounded-sm bg-paper border border-border hover:border-accent hover:text-accent transition-all shadow-sm"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4 p-6 bg-accent/5 border border-accent/10 rounded-sm">
             <Cpu className="size-5 text-accent opacity-50" />
             <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-ink">Type-safe SDK</p>
                  <span className="px-1.5 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-[2px] font-mono text-[8px] uppercase font-bold tracking-tighter">
                    Coming Soon
                  </span>
                </div>
                <p className="text-[10px] text-ink-muted font-light mt-1">Our upcoming type-safe TypeScript/React client library.</p>
             </div>
             <Button variant="ghost" size="icon" asChild>
                <Link href="/docs">
                  <ExternalLink className="size-4" />
                </Link>
             </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-paper border border-border rounded-sm space-y-8 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code2 className="size-4 text-accent" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Payload Preview</span>
              </div>
              <div className="flex gap-1.5">
                <div className="size-2 rounded-full bg-success/20 animate-pulse" />
                <div className="size-2 rounded-full bg-success/40" />
                <div className="size-2 rounded-full bg-success/60" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-canvas border border-border rounded-sm font-mono text-[11px] text-ink-faint leading-relaxed h-[200px] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-paper/50" />
                <p>{"{"}</p>
                <p className="pl-4">&quot;success&quot;: true,</p>
                <p className="pl-4">&quot;data&quot;: {"{"}</p>
                <p className="pl-8">&quot;id&quot;: &quot;entry_01JK...&quot;,</p>
                <p className="pl-8">&quot;slug&quot;: &quot;hello-world&quot;,</p>
                <p className="pl-8">&quot;content&quot;: &quot;Hello World&quot;,</p>
                <p className="pl-8">&quot;status&quot;: &quot;PUBLISHED&quot;</p>
                <p className="pl-4">{"}"}</p>
                <p>{"}"}</p>
              </div>
              
              <div className="pt-4 space-y-4">
                 <p className="text-[11px] font-medium text-ink-muted italic">&quot;Fetching content should be the easiest part of your job.&quot;</p>
                 <Button asChild className="w-full h-11 text-[11px] font-bold uppercase tracking-widest rounded-sm">
                   <Link href="/dashboard/collections">
                     Enter the Studio
                     <ArrowRight className="size-4 ml-2" />
                   </Link>
                 </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
