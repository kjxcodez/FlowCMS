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
  Lock,
} from "lucide-react";
import { useApiKeys } from "@/hooks/use-api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  scopes: string[];
}

const SCOPE_CATEGORIES = {
  Entries: [
    { id: "read:entries", description: "Retrieve content entries" },
    { id: "write:entries", description: "Create, update, and delete entries" },
  ],
  Media: [
    { id: "read:media", description: "List media assets" },
    { id: "write:media", description: "Upload/delete media assets" },
  ],
  Collections: [
    { id: "read:collections", description: "Read content schemas and definitions" },
    { id: "write:collections", description: "Define or delete content schemas" },
  ],
  Webhooks: [
    { id: "read:webhooks", description: "Read webhook configurations" },
    { id: "write:webhooks", description: "Create, update, and remove webhooks" },
  ],
};

export default function ApiKeysPage() {
  const { data, isLoading, createMutation, deleteMutation } = useApiKeys();
  const keys = (data || []) as ApiKey[];
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [originUrl, setOriginUrl] = useState("http://localhost:3000");

  // Selection Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read:entries", "read:media"]);

  // One-Time Reveal Dialog State
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [copiedGeneratedKey, setCopiedGeneratedKey] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("API key identifier prefix copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyGenerated = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGeneratedKey(true);
    toast.success("Raw API key copied successfully!");
    setTimeout(() => setCopiedGeneratedKey(false), 2000);
  };

  const handleToggleScope = (scopeId: string) => {
    setSelectedScopes((prev) => {
      if (prev.includes(scopeId)) {
        return prev.filter((s) => s !== scopeId);
      } else {
        return [...prev, scopeId];
      }
    });
  };

  const handleCreate = async () => {
    if (!newKeyLabel.trim()) return;
    setIsCreating(true);
    try {
      const response = await createMutation.mutateAsync({
        name: newKeyLabel,
        scopes: selectedScopes,
      });
      
      if (response.success && response.data?.key) {
        setGeneratedKey(response.data.key);
        setIsRevealOpen(true);
        setIsCreateDialogOpen(false);
        setNewKeyLabel("");
      } else {
        toast.error("Failed to generate API key.");
      }
    } catch {
      toast.error("Failed to generate API key.");
    } finally {
      setIsCreating(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"curl" | "fetch" | "axios">("curl");

  const codeSnippets = {
    curl: `curl -X GET "${originUrl}/api/v1/entries/blog-posts" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    fetch: `fetch('${originUrl}/api/v1/entries/blog-posts', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));`,
    axios: `import axios from 'axios';

axios.get('${originUrl}/api/v1/entries/blog-posts', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
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
            Manage authentication keys to access your structured content endpoints.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => {
              setNewKeyLabel("");
              setSelectedScopes(["read:entries", "read:media"]);
              setIsCreateDialogOpen(true);
            }}
            className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm"
          >
            <Plus className="size-3.5 mr-2" />
            Create API Key
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
            Never share your API keys or commit them directly to version control. Keys are one-way hashed inside our vault database and can only be revealed once during creation.
          </p>
        </div>
      </section>

      {/* Keys List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2].map(i => (
            <Skeleton key={i} className="h-32 rounded-sm" />
          ))
        ) : keys.length === 0 ? (
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
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setNewKeyLabel("");
                    setSelectedScopes(["read:entries", "read:media"]);
                    setIsCreateDialogOpen(true);
                  }}
                  className="h-10 text-[10px] font-bold uppercase tracking-widest rounded-sm shrink-0"
                >
                  Create API Key
                </Button>
              </div>
            </div>
          </div>
        ) : (
          keys.map((key) => (
            <Card key={key.id} className="bg-paper border-border rounded-sm overflow-hidden hover:border-border-strong transition-all group">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4 flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-canvas flex items-center justify-center text-accent group-hover:bg-accent/5 transition-colors">
                      <Key className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-ink leading-tight">{key.name}</p>
                      <p className="text-[10px] font-mono text-ink-faint uppercase tracking-widest mt-1">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Masked Key Display (Secure approach) */}
                  <div className="flex items-center gap-2 max-w-lg">
                    <div className="flex-1 h-10 flex items-center px-4 bg-canvas/50 rounded-sm font-mono text-[11px] text-ink-muted border border-border truncate group-hover:bg-canvas transition-colors">
                      {key.keyPrefix}••••••••••••••••••••••••
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(key.keyPrefix, key.id)}
                      className="size-10 text-ink-muted hover:text-accent hover:bg-accent/5 border border-border rounded-sm transition-all"
                      title="Copy Key Identifier (prefix only)"
                    >
                      {copiedId === key.id ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                    </Button>
                  </div>

                  {/* Display Key Scopes */}
                  <div className="flex flex-wrap gap-1.5">
                    {key.scopes && key.scopes.length > 0 ? (
                      key.scopes.map((scope) => (
                        <span key={scope} className="inline-flex items-center px-2.5 py-0.5 rounded bg-accent/5 border border-accent/15 text-accent text-[9px] font-mono font-medium leading-none">
                          {scope}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-ink-faint italic font-light">No scopes assigned</span>
                    )}
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
                    onClick={() => { if(confirm("Are you sure? This will break any application utilizing this key.")) deleteMutation.mutate(key.id) }}
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

      {/* Create Key Scope Selection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-xl bg-paper border-border rounded-sm p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-display text-2xl font-semibold text-ink">Create API Key</DialogTitle>
            <DialogDescription className="text-xs text-ink-muted font-light leading-relaxed">
              Create a new API key to authenticate requests against our REST APIs. Assign specific permissions (scopes) to enforce access control.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink">Key Label</label>
              <Input
                type="text"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder="Key label (e.g. Production API Key)"
                className="h-10 bg-canvas border-border text-sm w-full rounded-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink">Select Scopes</label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedScopes.includes("admin:workspace")) {
                      setSelectedScopes(["read:entries", "read:media"]);
                    } else {
                      setSelectedScopes(["admin:workspace"]);
                    }
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent-bright bg-transparent border-none cursor-pointer"
                >
                  {selectedScopes.includes("admin:workspace") ? "Use Standard Scopes" : "Set Admin Scope"}
                </button>
              </div>

              {selectedScopes.includes("admin:workspace") ? (
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-sm text-center">
                  <p className="text-xs text-accent font-medium">
                    Workspace Admin scope is enabled. This key will bypass all scope restrictions and have full access.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(SCOPE_CATEGORIES).map(([category, categoryScopes]) => (
                    <div key={category} className="p-4 bg-canvas border border-border rounded-sm space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{category}</h4>
                      <div className="space-y-2">
                        {categoryScopes.map((scope) => (
                          <label key={scope.id} className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] font-light text-ink hover:text-accent">
                            <input
                              type="checkbox"
                              checked={selectedScopes.includes(scope.id)}
                              onChange={() => handleToggleScope(scope.id)}
                              className="mt-0.5 rounded border-border text-accent focus:ring-accent size-3.5"
                            />
                            <div>
                              <span className="font-semibold block font-mono text-[10px] leading-tight text-ink">{scope.id}</span>
                              <span className="text-ink-faint text-[9px] block mt-0.5 leading-tight">{scope.description}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
              className="text-[11px] font-bold uppercase tracking-widest rounded-sm h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newKeyLabel.trim() || selectedScopes.length === 0}
              className="px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm h-11"
            >
              {isCreating ? "Generating..." : "Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-Time Reveal Dialog */}
      <Dialog open={isRevealOpen} onOpenChange={setIsRevealOpen}>
        <DialogContent className="max-w-md bg-paper border-border rounded-sm p-8">
          <DialogHeader className="space-y-3">
            <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2">
              <Shield className="size-6 animate-pulse" />
            </div>
            <DialogTitle className="font-display text-2xl font-semibold">One-Time API Key Reveal</DialogTitle>
            <DialogDescription className="text-xs text-ink-muted font-light leading-relaxed">
              This is the only time your API key will be displayed raw. Store it immediately in your secure `.env` properties. If you lose this key, you must revoke it and generate a new one.
            </DialogDescription>
          </DialogHeader>

          {generatedKey && (
            <div className="space-y-6 pt-4">
              <div className="relative group">
                <div className="h-14 flex items-center px-4 bg-canvas font-mono text-xs text-accent select-all rounded-sm border border-border break-all pr-14 leading-normal">
                  {generatedKey}
                </div>
                <Button 
                  size="icon" 
                  onClick={() => handleCopyGenerated(generatedKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-sm"
                  title="Copy Raw Key"
                >
                  {copiedGeneratedKey ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-start gap-3">
                <Lock className="size-3.5 shrink-0 mt-0.5" />
                <span>Once this window closes, the key is permanently obfuscated and hashed.</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setIsRevealOpen(false)}
              className="w-full h-11 text-[11px] font-bold uppercase tracking-widest rounded-sm"
            >
              I Have Saved This Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
