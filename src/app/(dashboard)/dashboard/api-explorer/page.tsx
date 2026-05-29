"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Terminal as TerminalIcon,
  Key,
  Layers,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Clock,
  ShieldCheck
} from "lucide-react";
import { useCollections } from "@/hooks/use-collections";
import { useApiKeys } from "@/hooks/use-api-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
}

interface ExecutionPerformance {
  statusCode: number;
  latencyMs: number;
  apiKeyName: string;
  timestamp: string;
  headers: Record<string, string>;
}

interface ExecutionResponse {
  entries: unknown[];
  meta: {
    total: number;
    page: number;
    perPage: number;
  };
  performance: ExecutionPerformance;
}

export default function ApiExplorerPage() {
  const { data: collectionsData, isLoading: isCollectionsLoading } = useCollections();
  const { data: apiKeysData, isLoading: isApiKeysLoading } = useApiKeys();

  const collections = useMemo(() => (collectionsData || []) as Collection[], [collectionsData]);
  const apiKeys = useMemo(() => (apiKeysData || []) as ApiKey[], [apiKeysData]);

  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<string>("");
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"curl" | "fetch" | "axios">("curl");
  
  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [showHeaders, setShowHeaders] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [originUrl, setOriginUrl] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Pre-select first options when data is loaded
  useEffect(() => {
    if (collections.length > 0 && !selectedCollectionSlug) {
      setSelectedCollectionSlug(collections[0].slug);
    }
  }, [collections, selectedCollectionSlug]);

  useEffect(() => {
    if (apiKeys.length > 0 && !selectedApiKeyId) {
      setSelectedApiKeyId(apiKeys[0].id);
    }
  }, [apiKeys, selectedApiKeyId]);

  const selectedKey = apiKeys.find((k) => k.id === selectedApiKeyId);

  // Code snippet definitions
  const snippets = useMemo(() => {
    const keyPrefix = selectedKey ? `flw_${selectedKey.keyPrefix}••••••••` : "YOUR_API_KEY";
    const slug = selectedCollectionSlug || "collection-slug";
    return {
      curl: `curl -X GET "${originUrl}/api/v1/entries/${slug}" \\\n  -H "Authorization: Bearer ${keyPrefix}"`,
      fetch: `fetch('${originUrl}/api/v1/entries/${slug}', {\n  headers: {\n    'Authorization': 'Bearer ${keyPrefix}'\n  }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`,
      axios: `const axios = require('axios');\n\naxios.get('${originUrl}/api/v1/entries/${slug}', {\n  headers: {\n    'Authorization': 'Bearer ${keyPrefix}'\n  }\n})\n  .then(res => console.log(res.data))\n  .catch(err => console.error(err));`
    };
  }, [selectedKey, selectedCollectionSlug, originUrl]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    toast.success(`${type.toUpperCase()} command copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRunRequest = async () => {
    if (!selectedCollectionSlug) {
      toast.error("Please select a collection first.");
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    try {
      const res = await fetch("/api/internal/api-explorer/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionSlug: selectedCollectionSlug,
          apiKeyId: selectedApiKeyId || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setExecutionResult(json.data as ExecutionResponse);
        toast.success("Query executed successfully!");
      } else {
        toast.error(json.error?.message || "Failed to execute request.");
      }
    } catch (err) {
      toast.error("Connection failure. Webhook/Request failed.");
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border-strong/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent uppercase tracking-widest mb-1.5">
            <Cpu className="size-3.5 text-accent animate-pulse" />
            Developer Console
          </div>
          <h1 className="font-display text-4xl font-semibold text-ink">
            API <em className="italic text-accent not-italic">Explorer</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-lg font-light leading-relaxed">
            Construct live payloads, audit performance latencies, and verify API responses inside your browser.
          </p>
        </div>
      </header>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Code Builder */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-2 border-border bg-paper rounded-none relative overflow-hidden ruled-bg">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="font-display text-lg font-bold">Request Builder</CardTitle>
              <CardDescription className="text-xs text-ink-muted">Configure collection query options and API authentication.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              {/* Collection Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">
                  <Layers className="size-3 text-ink-faint" />
                  Select Collection
                </label>
                {isCollectionsLoading ? (
                  <div className="h-10 bg-canvas border border-border animate-pulse rounded-none" />
                ) : collections.length === 0 ? (
                  <div className="p-4 bg-canvas/30 border border-dashed border-border rounded-none text-center">
                    <p className="text-xs text-ink-muted mb-3">No collections found.</p>
                    <Button size="sm" asChild className="h-8 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest">
                      <Link href="/dashboard/collections/new">Create Collection</Link>
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedCollectionSlug}
                    onChange={(e) => setSelectedCollectionSlug(e.target.value)}
                    className="w-full h-10 px-3 bg-canvas border border-border text-xs text-ink font-mono focus:outline-none focus:border-accent rounded-none cursor-pointer"
                  >
                    {collections.map((col) => (
                      <option key={col.id} value={col.slug}>
                        {col.name} ({col.slug})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* API Key Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">
                  <Key className="size-3 text-ink-faint" />
                  Select API Key
                </label>
                {isApiKeysLoading ? (
                  <div className="h-10 bg-canvas border border-border animate-pulse rounded-none" />
                ) : apiKeys.length === 0 ? (
                  <div className="p-4 bg-canvas/30 border border-dashed border-border rounded-none text-center">
                    <p className="text-xs text-ink-muted mb-3">No active API keys found.</p>
                    <Button size="sm" asChild className="h-8 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest bg-accent text-sidebar hover:bg-accent-bright">
                      <Link href="/dashboard/api-keys">Generate API Key</Link>
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedApiKeyId}
                    onChange={(e) => setSelectedApiKeyId(e.target.value)}
                    className="w-full h-10 px-3 bg-canvas border border-border text-xs text-ink font-mono focus:outline-none focus:border-accent rounded-none cursor-pointer"
                  >
                    {apiKeys.map((key) => (
                      <option key={key.id} value={key.id}>
                        {key.name} (flw_{key.keyPrefix}...)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardContent>
            <div className="absolute inset-0 pointer-events-none noise-overlay opacity-10" />
          </Card>

          {/* Snippet Generator panel */}
          {selectedCollectionSlug && (
            <Card className="border-2 border-border bg-sidebar text-sidebar-foreground rounded-none relative overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TerminalIcon className="size-4 text-accent-bright" />
                  Snippet Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {/* Tabs */}
                <div className="flex bg-sidebar-border/40 border border-sidebar-border/30 rounded-none p-0.5">
                  {(["curl", "fetch", "axios"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 text-center font-mono text-[9px] font-bold uppercase tracking-widest rounded-none border-none cursor-pointer transition-all ${
                        activeTab === tab
                          ? "bg-accent-bright text-sidebar font-extrabold"
                          : "text-sidebar-foreground/60 hover:text-white bg-transparent"
                      }`}
                    >
                      {tab === "curl" ? "cURL" : tab}
                    </button>
                  ))}
                </div>

                {/* Preformatted code block */}
                <div className="relative">
                  <pre className="bg-[#0F1109] p-4 text-[10px] font-mono text-white/80 overflow-auto max-h-64 custom-scrollbar rounded-none border border-sidebar-border/50">
                    <code>{snippets[activeTab]}</code>
                  </pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(snippets[activeTab], activeTab)}
                    className="absolute top-2 right-2 size-7 text-sidebar-foreground/40 hover:text-white hover:bg-white/5 border border-white/5 rounded-none"
                    title="Copy snippet"
                  >
                    {copiedText === activeTab ? (
                      <Check className="size-3 text-accent-bright" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
              <div className="absolute inset-0 pointer-events-none noise-overlay opacity-10" />
            </Card>
          )}
        </div>

        {/* Right Column: Execution Live Console */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <TerminalIcon className="size-4 text-accent" />
              Live Request Terminal
            </h3>

            <Button
              onClick={handleRunRequest}
              disabled={isRunning || !selectedCollectionSlug}
              className="h-10 px-6 bg-accent hover:bg-accent-bright text-sidebar rounded-none font-mono text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2"
            >
              <Play className={`size-3 fill-current ${isRunning ? "animate-ping" : ""}`} />
              {isRunning ? "Executing Request..." : "Run Request"}
            </Button>
          </div>

          {/* Console Output Drawer */}
          <div className="flex-1 min-h-[400px] bg-[#0E100A] border-2 border-border rounded-none flex flex-col relative overflow-hidden">
            {/* Console Header Bar */}
            <div className="px-6 py-3 bg-[#080905] border-b border-border flex items-center justify-between gap-4 font-mono text-[10px] text-white/50">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-destructive" />
                <div className="size-2 rounded-full bg-orange-400" />
                <div className="size-2 rounded-full bg-success" />
                <span className="ml-2 font-bold uppercase tracking-wider text-white/30">GET /api/v1/entries/{selectedCollectionSlug || "..."}</span>
              </div>
              {executionResult?.performance && (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-success font-bold">
                    <ShieldCheck className="size-3.5" />
                    {executionResult.performance.statusCode} OK
                  </span>
                  <span className="flex items-center gap-1 text-accent-bright font-bold">
                    <Clock className="size-3.5" />
                    {executionResult.performance.latencyMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* Console Body Content */}
            <div className="flex-1 p-6 font-mono text-[11px] text-white/70 overflow-auto custom-scrollbar flex flex-col gap-4">
              {isRunning ? (
                <div className="m-auto flex flex-col items-center gap-4 text-white/30">
                  <div className="size-6 border-2 border-accent-bright/30 border-t-accent-bright rounded-full animate-spin" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Querying FlowCMS REST Engine...</span>
                </div>
              ) : !executionResult ? (
                <div className="m-auto text-center max-w-sm space-y-4 p-8 text-white/30">
                  <TerminalIcon className="size-10 mx-auto opacity-10 animate-bounce duration-1000" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Command Injection</p>
                    <p className="text-[10px] font-light leading-relaxed">
                      Select a collection slug and API authorization header on the left, then trigger <em className="italic text-accent-bright">Run Request</em>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 w-full">
                  {/* Performance collapse */}
                  <div className="border border-white/5 bg-white/[0.01]">
                    <button
                      onClick={() => setShowHeaders(!showHeaders)}
                      className="w-full px-4 py-2 bg-white/[0.02] border-none text-[10px] font-mono text-white/40 hover:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-bold uppercase tracking-wider">HTTP Response Headers</span>
                      {showHeaders ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </button>
                    {showHeaders && (
                      <div className="p-4 border-t border-white/5 space-y-1.5 text-white/50 text-[10px]">
                        {Object.entries(executionResult.performance.headers).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 font-mono">
                            <span className="text-accent-bright font-bold">{k}:</span>
                            <span className="text-right whitespace-pre-wrap break-all select-all">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Formatted Response JSON */}
                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center text-[9px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 pb-2">
                      <span>JSON Response Body ({executionResult.meta.total} Entries)</span>
                      <button
                        onClick={() => handleCopy(JSON.stringify(executionResult.entries, null, 2), "response")}
                        className="bg-transparent border-none text-white/30 hover:text-white font-bold font-mono tracking-wider cursor-pointer uppercase flex items-center gap-1.5"
                      >
                        <Copy className="size-3" />
                        Copy Response
                      </button>
                    </div>
                    <pre className="p-2 text-white/80 overflow-x-auto text-[10px] leading-relaxed select-all">
                      <code>{JSON.stringify(executionResult.entries, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
            {/* Ambient overlay */}
            <div className="absolute inset-0 pointer-events-none noise-overlay opacity-10" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 blur-[80px] pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
