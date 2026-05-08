"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  ChevronRight,
  Globe,
  Lock,
  Eye,
  History,
  Info
} from "lucide-react";
import Link from "next/link";
import { useCreateEntry } from "@/hooks/use-entries";
import { useContentType } from "@/hooks/use-content-types";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
  slug: string;
  type: string;
  required?: boolean;
}

export default function NewEntryPage() {
  const { id: contentTypeId } = useParams() as { id: string };
  const router = useRouter();
  const { data: contentType } = useContentType(contentTypeId);
  const createMutation = useCreateEntry();
  
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [published, setPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize content with empty values based on schema
  useEffect(() => {
    if (contentType?.fields) {
      const initial: Record<string, unknown> = {};
      contentType.fields.forEach((f: Field) => {
        initial[f.slug] = f.type === "boolean" ? false : "";
      });
      setContent(initial);
    }
  }, [contentType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createMutation.mutateAsync({
        contentTypeId,
        content,
        published,
      });
      router.push(`/dashboard/content-types/${contentTypeId}/entries`);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const renderField = (field: Field) => {
    const value = (content[field.slug] as string) || "";
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
      setContent(prev => ({ ...prev, [field.slug]: e.target.value }));

    return (
      <div key={field.id} className="space-y-2">
        <label className="block font-mono text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest">
          {field.name} {field.required && <span className="text-[var(--destructive)]">*</span>}
        </label>
        
        {field.type === "text" && (
          <input 
            type="text" 
            value={value}
            onChange={onChange}
            className="w-full bg-[var(--paper)] border border-[var(--border)] rounded px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] transition-all"
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        )}

        {field.type === "richtext" && (
          <textarea 
            value={value}
            onChange={onChange}
            rows={6}
            className="w-full bg-[var(--paper)] border border-[var(--border)] rounded px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] transition-all"
            placeholder={`Write ${field.name.toLowerCase()} content...`}
          />
        )}

        {field.type === "number" && (
          <input 
            type="number" 
            value={value}
            onChange={onChange}
            className="w-full bg-[var(--paper)] border border-[var(--border)] rounded px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] transition-all"
          />
        )}

        {field.type === "date" && (
          <input 
            type="date" 
            value={value}
            onChange={onChange}
            className="w-full bg-[var(--paper)] border border-[var(--border)] rounded px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] transition-all"
          />
        )}

        {field.type === "boolean" && (
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={!!value}
              onChange={(e) => setContent(prev => ({ ...prev, [field.slug]: e.target.checked }))}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            <span className="text-xs text-[var(--ink-muted)]">{field.name}</span>
          </div>
        )}

        {field.type === "media" && (
          <div className="p-4 border-2 border-dashed border-[var(--border)] rounded flex flex-col items-center justify-center gap-2 text-[var(--ink-faint)] bg-[var(--paper)]">
             <Info className="w-4 h-4" />
             <span className="text-[10px] font-semibold uppercase tracking-widest">Media Picker Placeholder</span>
             <button type="button" className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider hover:underline">Select File</button>
          </div>
        )}

        {field.type === "reference" && (
          <select 
            value={value}
            onChange={onChange}
            className="w-full bg-[var(--paper)] border border-[var(--border)] rounded px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] transition-all"
          >
            <option value="">Select entry...</option>
          </select>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/dashboard/content-types/${contentTypeId}/entries`}
            className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--ink-faint)] mb-1">
              <Link href="/dashboard/content-types" className="hover:text-[var(--ink-muted)]">Content Types</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/dashboard/content-types/${contentTypeId}/entries`} className="hover:text-[var(--ink-muted)]">{contentType?.title || "Type"}</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[var(--accent)]">New Entry</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
              Create <em>Entry</em>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 h-11 border border-[var(--border)] rounded text-xs font-semibold uppercase tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)] transition-all">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 h-11 bg-[var(--accent)] text-white rounded text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? "Saving..." : (
              <>
                <Save className="w-4 h-4" />
                Save Entry
              </>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Content: Dynamic Form */}
        <div className="lg:col-span-3 space-y-8">
          <section className="p-10 bg-[var(--paper)] border border-[var(--border)] rounded shadow-sm space-y-8">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-4">
              <Globe className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Local Content (EN)</h2>
            </div>
            
            <div className="space-y-8">
              {contentType?.fields?.map(renderField)}
              {(!contentType?.fields || contentType.fields.length === 0) && (
                <div className="py-20 text-center text-[var(--ink-faint)] text-sm">
                  This content type has no fields defined. 
                  <Link href={`/dashboard/content-types/${contentTypeId}`} className="text-[var(--accent)] ml-1 hover:underline">Edit schema</Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: Entry Info */}
        <aside className="lg:col-span-1 space-y-8">
          <section className="p-6 bg-[var(--paper)] border border-[var(--border)] rounded space-y-6">
            <h3 className="font-display text-lg font-semibold text-[var(--ink)]">Publishing</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <Lock className="w-3.5 h-3.5" />
                  Visibility
                </div>
                <span className="text-xs font-semibold">Public</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                   <Globe className="w-3.5 h-3.5" />
                   Status
                </div>
                <button 
                  onClick={() => setPublished(!published)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded",
                    published ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--ink-muted)]/10 text-[var(--ink-muted)]"
                  )}
                >
                  {published ? "Published" : "Draft"}
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border)] space-y-4">
              <button className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">
                <History className="w-3.5 h-3.5" />
                View Version History
              </button>
              <button className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--destructive)] hover:underline transition-colors">
                Delete Entry
              </button>
            </div>
          </section>

          <section className="p-5 bg-[var(--canvas)] border border-[var(--border)] rounded space-y-3">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink)]">API Info</h4>
             </div>
             <p className="text-[10px] font-mono text-[var(--ink-muted)] leading-relaxed">
               ID: {contentTypeId}<br/>
               SLUG: {contentType?.slug || "..."}<br/>
               LOCALE: en-US
             </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
