"use client";

import React, { useState } from "react";
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Check, 
  Shield, 
  Clock,
  Eye,
  EyeOff
} from "lucide-react";
import { useApiKeys } from "@/hooks/use-api-keys";

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async () => {
    if (!newKeyLabel) return;
    setIsCreating(true);
    try {
      await createMutation.mutateAsync(newKeyLabel);
      setNewKeyLabel("");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--ink)] mb-2">
            API <em>Keys</em>
          </h1>
          <p className="text-[var(--ink-muted)] text-sm max-w-md">
            Manage authentication keys to access your content via the public REST API.
          </p>
        </div>
        <div className="flex gap-3">
           <input 
              type="text" 
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="Key label (e.g. Production)"
              className="px-4 h-10 bg-[var(--paper)] border border-[var(--border)] rounded text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)] transition-all w-64"
            />
          <button 
            onClick={handleCreate}
            disabled={isCreating || !newKeyLabel}
            className="flex items-center gap-2 px-4 h-10 bg-[var(--sidebar)] text-white rounded text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? "Generating..." : "Generate Key"}
          </button>
        </div>
      </header>

      {/* Warning Box */}
      <section className="p-4 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded flex gap-4">
        <Shield className="w-5 h-5 text-[var(--accent)] shrink-0" />
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[var(--ink)]">Security Best Practices</h4>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Never share your API keys or commit them to version control. Use environment variables to manage them in your application.
          </p>
        </div>
      </section>

      {/* Keys List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="h-32 bg-[var(--paper)] border border-[var(--border)] rounded animate-pulse" />
          ))
        ) : keys?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--paper)] border border-[var(--border)] border-dashed rounded text-[var(--ink-faint)]">
            <Key className="w-8 h-8 mb-4 opacity-20" />
            <p className="text-sm">No API keys generated yet.</p>
          </div>
        ) : (
          keys?.map((key) => (
            <div key={key.id} className="p-6 bg-[var(--paper)] border border-[var(--border)] rounded flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[var(--border-strong)] transition-all">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[var(--canvas)] flex items-center justify-center text-[var(--accent)]">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{key.title}</p>
                    <p className="text-[10px] font-mono text-[var(--ink-faint)] uppercase tracking-widest">Created {new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* The Key Value (redacted by default) */}
                <div className="flex items-center gap-2 max-w-md">
                   <div className="flex-1 h-9 flex items-center px-4 bg-[var(--canvas)] rounded font-mono text-xs text-[var(--ink-muted)] border border-[var(--border)] truncate">
                      {showKeyId === key.id ? key.key : "••••••••••••••••••••••••••••••••"}
                   </div>
                   <button 
                    onClick={() => setShowKeyId(showKeyId === key.id ? null : key.id)}
                    className="p-2.5 bg-[var(--paper)] border border-[var(--border)] rounded text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all"
                   >
                     {showKeyId === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                   <button 
                    onClick={() => handleCopy(key.key, key.id)}
                    className="p-2.5 bg-[var(--paper)] border border-[var(--border)] rounded text-[var(--ink-muted)] hover:text-[var(--accent)] transition-all"
                   >
                     {copiedId === key.id ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--ink-faint)] uppercase tracking-widest">
                   <Clock className="w-3.5 h-3.5" />
                   Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}
                </div>
                <button 
                  onClick={() => { if(confirm("Are you sure? This will break any app using this key.")) deleteMutation.mutate(key.id) }}
                  className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--destructive)] hover:bg-[var(--destructive)]/5 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Revoke Key
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Integration Info */}
      <section className="p-8 bg-[var(--canvas)] border border-[var(--border)] rounded space-y-6">
        <h3 className="font-display text-xl font-semibold text-[var(--ink)]">Integration Guide</h3>
        <div className="space-y-4">
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Include your API key in the <code>x-api-key</code> header of your requests to access content.
          </p>
          <div className="p-4 bg-black rounded font-mono text-[11px] text-[var(--accent-bright)] overflow-x-auto">
            curl -X GET &quot;https://api.flowcms.io/v1/entries/blog-post&quot; \<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-H &quot;x-api-key: YOUR_API_KEY&quot;
          </div>
        </div>
      </section>
    </div>
  );
}
