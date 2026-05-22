"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Check, 
  Shield, 
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApiKeys } from "@/hooks/use-api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  title: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function ApiKeysPage() {
  const { data, isLoading, createMutation, deleteMutation } = useApiKeys();
  const keys = data as ApiKey[];
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [originUrl, setOriginUrl] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async () => {
    if (!newKeyLabel) return;
    setIsCreating(true);
    try {
      await createMutation.mutateAsync(newKeyLabel);
      setNewKeyLabel("");
      toast.success("New API key generated successfully!");
    } catch {
      toast.error("Failed to generate API key.");
    } finally {
      setIsCreating(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"curl" | "fetch" | "axios">("curl");

  const activeKeyVal = keys?.[0]?.key || "fcms_dev_key_sample1234567890abcdef";

  const codeSnippets = {
    curl: `curl -X GET "${originUrl}/api/v1/entries/blog" \\
  -H "Authorization: Bearer ${activeKeyVal}"`,
    fetch: `fetch('${originUrl}/api/v1/entries/blog', {
  headers: {
    'Authorization': 'Bearer ${activeKeyVal}'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));`,
    axios: `import axios from 'axios';

axios.get('${originUrl}/api/v1/entries/blog', {
  headers: {
    'Authorization': 'Bearer ${activeKeyVal}'
  }
})
  .then(res => console.log(res.data));`
  };

  const copyGuideSnippet = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    toast.success(`${activeTab.toUpperCase()} code snippet copied!`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            API <em className="italic text-accent not-italic">Keys</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Manage authentication keys to access your content via the public REST API.
          </p>
        </div>
        <div className="flex gap-3">
          <Input 
            type="text" 
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
            placeholder="Key label (e.g. Production)"
            className="h-10 bg-paper border-border text-sm w-64 rounded-sm"
          />
          <Button 
            onClick={handleCreate}
            disabled={isCreating || !newKeyLabel}
            className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm"
          >
            <Plus className="size-3.5 mr-2" />
            {isCreating ? "Generating..." : "Generate Key"}
          </Button>
        </div>
      </header>

      {/* Warning Box */}
      <section className="p-5 bg-accent/5 border border-accent/20 rounded-sm flex gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-full graph-bg opacity-[0.03] -mr-8" />
        <Shield className="size-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1.5 relative z-10">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink">Security Best Practices</h4>
          <p className="text-xs text-ink-muted leading-relaxed font-light">
            Never share your API keys or commit them to version control. Use environment variables to manage them in your application.
          </p>
        </div>
      </section>

      {/* Keys List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2].map(i => (
            <Skeleton key={i} className="h-32 rounded-sm" />
          ))
        ) : keys?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-paper border border-border border-dashed rounded-sm graph-bg relative overflow-hidden text-center max-w-2xl mx-auto">
            <div className="absolute inset-0 graph-bg opacity-[0.03]" />
            <div className="relative z-10 space-y-6 max-w-sm">
              <div className="size-16 rounded-full bg-canvas border border-border flex items-center justify-center mx-auto">
                <Key className="size-6 text-ink-faint" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl font-semibold text-ink">No API keys active</h3>
                <p className="text-xs text-ink-muted font-light leading-relaxed">
                  Generate your first key to start accessing the headless content delivery REST endpoints.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="Key label (e.g. Development)"
                  className="h-10 bg-canvas border-border text-xs rounded-sm w-44"
                />
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !newKeyLabel}
                  className="h-10 text-[10px] font-bold uppercase tracking-widest rounded-sm shrink-0"
                >
                  Create Key
                </Button>
              </div>
            </div>
          </div>
        ) : (
          keys?.map((key) => (
            <Card key={key.id} className="bg-paper border-border rounded-sm overflow-hidden hover:border-border-strong transition-all group">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-5 flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-canvas flex items-center justify-center text-accent group-hover:bg-accent/5 transition-colors">
                      <Key className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-ink leading-tight">{key.title}</p>
                      <p className="text-[10px] font-mono text-ink-faint uppercase tracking-widest mt-1">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* The Key Value */}
                  <div className="flex items-center gap-2 max-w-lg">
                    <div className="flex-1 h-10 flex items-center px-4 bg-canvas/50 rounded-sm font-mono text-[11px] text-ink-muted border border-border truncate group-hover:bg-canvas transition-colors">
                      {showKeyId === key.id ? key.key : "••••••••••••••••••••••••••••••••"}
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowKeyId(showKeyId === key.id ? null : key.id)}
                      className="size-10 text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-sm"
                    >
                      {showKeyId === key.id ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(key.key, key.id)}
                      className="size-10 text-ink-muted hover:text-accent hover:bg-accent/5 border border-border rounded-sm transition-all"
                    >
                      {copiedId === key.id ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-4 shrink-0">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-ink-faint uppercase tracking-widest">
                    <Clock className="size-3.5" />
                    Last used: <span className="text-ink-muted">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}</span>
                  </div>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => { if(confirm("Are you sure? This will break any app using this key.")) deleteMutation.mutate(key.id) }}
                    className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/5 hover:text-destructive rounded-sm"
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Revoke Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Integration Guide */}
      <section className="bg-paper border border-border rounded-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent-bright" />
              <h3 className="font-display text-2xl font-semibold text-ink">Integration Guide</h3>
            </div>
            
            {/* Lang switcher */}
            <div className="flex bg-canvas border border-border rounded-sm p-0.5">
              {(["curl", "fetch", "axios"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest rounded-sm border-none cursor-pointer transition-all ${
                    activeTab === lang
                      ? "bg-accent text-sidebar font-black"
                      : "text-ink-muted hover:text-ink bg-transparent"
                  }`}
                >
                  {lang === "curl" ? "cURL" : lang === "fetch" ? "Fetch" : "Axios"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-ink-muted leading-relaxed font-light">
              Include your active API key inside the HTTP <code className="bg-canvas px-1.5 py-0.5 rounded text-accent font-mono text-[13px]">Authorization: Bearer YOUR_API_KEY</code> header of your content retrieval requests.
            </p>
            <div className="p-6 bg-sidebar rounded-sm font-mono text-[11px] text-accent-bright/90 overflow-x-auto relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button 
                   variant="ghost" 
                   size="icon-xs" 
                   className="text-white/40 hover:text-white"
                   onClick={copyGuideSnippet}
                 >
                   <Copy className="size-3" />
                 </Button>
              </div>
              {codeSnippets[activeTab]}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
