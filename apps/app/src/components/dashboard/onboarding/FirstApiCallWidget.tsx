"use client";

import React, { useState, useEffect } from "react";
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiKeys } from "@/hooks/use-api-keys";
import { toast } from "sonner";
import Link from "next/link";

export function FirstApiCallWidget() {
  const { data: apiKeys } = useApiKeys();
  const [activeTab, setActiveTab] = useState<
    "curl" | "fetch" | "axios" | "typescript"
  >("curl");
  const [copied, setCopied] = useState(false);
  const [originUrl, setOriginUrl] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const apiKey = apiKeys?.[0]?.key || "fcms_dev_key_sample1234567890abcdef";

  const codeSnippets = {
    curl: `curl -X GET "${originUrl}/api/v1/entries/blog" \\
  -H "Authorization: Bearer ${apiKey}"`,

    fetch: `fetch('${originUrl}/api/v1/entries/blog', {
  headers: {
    'Authorization': 'Bearer ${apiKey}'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));`,

    axios: `import axios from 'axios';

axios.get('${originUrl}/api/v1/entries/blog', {
  headers: {
    'Authorization': 'Bearer ${apiKey}'
  }
})
  .then(res => console.log(res.data));`,

    typescript: `import { FlowClient } from '@flowcms/client';

const flow = new FlowClient({
  apiKey: '${apiKey}',
  origin: '${originUrl}'
});

const blogEntries = await flow.entries.list('blog');
console.log(blogEntries);`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    toast.success(`${activeTab.toUpperCase()} snippet copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      id="first-api-widget"
      className="bg-[#0F110A] border border-accent/20 rounded-sm overflow-hidden shadow-2xl relative group"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[60px] -mr-16 -mt-16 group-hover:bg-accent/10 transition-all pointer-events-none" />

      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <Terminal className="size-4 animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
              Sandbox Explorer
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-white">
            First API Call Sandbox
          </h3>
          <p className="text-xs text-white/50 font-light">
            Fetch pre-seeded Blog entries immediately. Select your language and
            execute queries.
          </p>
        </div>

        {/* Tab Controls */}
        <div
          className="flex bg-white/[0.03] border border-white/5 rounded-sm p-0.5"
          role="tablist"
        >
          {(["curl", "fetch", "axios", "typescript"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest rounded-sm border-none cursor-pointer transition-all ${
                activeTab === tab
                  ? "bg-accent text-sidebar shadow-md font-black"
                  : "text-white/40 hover:text-white/80 bg-transparent"
              }`}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {tab === "curl"
                ? "cURL"
                : tab === "fetch"
                  ? "Fetch"
                  : tab === "axios"
                    ? "Axios"
                    : "TS Client"}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
        {/* Left Side: Code Editor block */}
        <div className="p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                Source Code Editor
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleCopy}
                className="text-white/40 hover:text-accent hover:bg-accent/15 border border-white/5 rounded-sm px-2.5 h-8 font-mono text-[9px] uppercase tracking-widest transition-all"
              >
                {copied ? (
                  <Check className="size-3 mr-1 text-success" />
                ) : (
                  <Copy className="size-3 mr-1" />
                )}
                Copy Code
              </Button>
            </div>

            <div className="p-6 bg-black/40 border border-white/5 rounded-sm font-mono text-[11px] leading-relaxed text-accent-bright/90 overflow-x-auto whitespace-pre min-h-[220px]">
              {codeSnippets[activeTab]}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-sm p-4 text-[10px] font-mono text-white/50">
            <Sparkles className="size-4 text-accent shrink-0" />
            <span>
              Dynamic authorization complete. Your active API key prefix{" "}
              <code className="text-accent">{apiKey.substring(0, 8)}...</code>{" "}
              is pre-populated in the headers.
            </span>
          </div>
        </div>

        {/* Right Side: Payload Preview */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Code2 className="size-4 text-accent" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                Response Payload Preview (200 OK)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success/20 animate-pulse" />
              <span className="size-2 rounded-full bg-success/60" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-success">
                Active
              </span>
            </div>
          </div>

          <div className="p-6 bg-black/40 border border-white/5 rounded-sm font-mono text-[10px] leading-relaxed text-white/40 h-[220px] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />
            <p className="text-accent">{"{"}</p>
            <p className="pl-4">
              <span className="text-white">&quot;success&quot;</span>:{" "}
              <span className="text-success">true</span>,
            </p>
            <p className="pl-4">
              <span className="text-white">&quot;data&quot;</span>: [
            </p>
            <p className="pl-8">{"{"}</p>
            <p className="pl-12">
              <span className="text-white">&quot;id&quot;</span>:{" "}
              <span className="text-accent-bright">
                &quot;entry_first_post_id&quot;
              </span>
              ,
            </p>
            <p className="pl-12">
              <span className="text-white">&quot;slug&quot;</span>:{" "}
              <span className="text-accent-bright">
                &quot;my-first-post&quot;
              </span>
              ,
            </p>
            <p className="pl-12">
              <span className="text-white">&quot;data&quot;</span>: {"{"}
            </p>
            <p className="pl-16">
              <span className="text-white">&quot;title&quot;</span>:{" "}
              <span className="text-accent-bright">
                &quot;My First Post&quot;
              </span>
              ,
            </p>
            <p className="pl-16">
              <span className="text-white">&quot;content&quot;</span>:{" "}
              <span className="text-accent-bright">
                &quot;Welcome to your newly provisioned headless CMS
                sandbox...&quot;
              </span>
            </p>
            <p className="pl-12">{"}"},</p>
            <p className="pl-12">
              <span className="text-white">&quot;status&quot;</span>:{" "}
              <span className="text-accent-bright">&quot;PUBLISHED&quot;</span>,
            </p>
            <p className="pl-12">
              <span className="text-white">&quot;createdAt&quot;</span>:{" "}
              <span className="text-accent-bright">
                &quot;2026-05-22T22:30:21.000Z&quot;
              </span>
            </p>
            <p className="pl-8">{"}"}</p>
            <p className="pl-4">],</p>
            <p className="pl-4">
              <span className="text-white">&quot;meta&quot;</span>: {"{"}
            </p>
            <p className="pl-8">
              <span className="text-white">&quot;total&quot;</span>: 1,
            </p>
            <p className="pl-8">
              <span className="text-white">&quot;page&quot;</span>: 1,
            </p>
            <p className="pl-8">
              <span className="text-white">&quot;perPage&quot;</span>: 20
            </p>
            <p className="pl-4">{"}"}</p>
            <p className="text-accent">{"}"}</p>
          </div>

          <Button
            asChild
            className="w-full h-11 bg-accent text-sidebar hover:bg-accent-bright font-mono text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(var(--accent-bright-rgb),0.2)] rounded-sm"
          >
            <Link href="/dashboard/collections">Open the Studio</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
