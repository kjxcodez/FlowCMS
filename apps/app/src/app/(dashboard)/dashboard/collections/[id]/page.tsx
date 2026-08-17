"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Layers, 
  ChevronRight,
  Trash2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { FieldBuilder } from "@/components/content-types/FieldBuilder";
import { FieldDefinition } from "@/types/cms";
import { useCollection, useUpdateCollection, useDeleteCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditCollectionPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { data: collection, isLoading } = useCollection(id as string);
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setSlug(collection.slug);
      setDescription(collection.description || "");
      setFields(collection.fields as FieldDefinition[] || []);
    }
  }, [collection]);

  const handleSave = async () => {
    if (!name || !slug) return;
    setIsSaving(true);
    
    try {
      await updateMutation.mutateAsync({
        id: id as string,
        name,
        slug,
        description,
        fields,
      });
      router.refresh();
      setIsSaving(false);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id as string);
      router.push("/dashboard/collections");
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-10">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-3 gap-10">
          <Skeleton className="col-span-2 h-96" />
          <Skeleton className="col-span-1 h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/collections"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink-muted hover:text-ink hover:border-border-strong transition-all"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-ink-faint mb-1">
              <Link href="/dashboard/collections" className="hover:text-ink-muted">Collections</Link>
              <ChevronRight className="size-3" />
              <span className="text-accent">{collection?.name}</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink uppercase tracking-tight italic">
              Edit <span className="text-accent not-italic">Collection</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-ink-faint hover:text-destructive transition-colors">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-paper border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-xl">Delete Collection?</AlertDialogTitle>
                  <AlertDialogDescription className="text-ink-muted font-light">
                    This will permanently delete the &quot;<span className="font-bold">{collection?.name}</span>&quot; collection and all associated entries. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-sm">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-sm">
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={handleSave}
              disabled={isSaving || !name || !slug}
              className="rounded-sm px-6 h-11 text-[11px] font-bold uppercase tracking-widest shadow-lg"
            >
              {isSaving ? "Saving..." : (
                <>
                  <Save className="size-4 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Field Builder */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Layers className="size-4 text-accent" />
              <h2 className="font-display text-xl font-semibold text-ink uppercase tracking-tighter italic">Fields</h2>
            </div>
            <FieldBuilder fields={fields} onChange={setFields} />
          </section>
        </div>

        {/* Sidebar: Configuration */}
        <aside className="lg:col-span-1 space-y-8">
          <section className="p-8 bg-paper border border-border-strong rounded-sm space-y-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-ink uppercase tracking-widest text-[11px]">Configuration</h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="block font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                  Display Name
                </Label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-canvas border-border h-10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="block font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                  API Slug
                </Label>
                <Input 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="font-mono text-xs bg-canvas border-border h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="block font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                  Description
                </Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-canvas border-border text-sm min-h-[80px]"
                />
              </div>
            </div>
          </section>

          <section className="p-6 bg-accent/5 border border-accent/20 rounded-sm flex gap-4">
            <AlertCircle className="size-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-accent uppercase tracking-widest">Destructive Updates</h4>
              <p className="text-[12px] text-accent/70 leading-relaxed font-light">
                Removing or renaming fields may cause existing entry data to become unreachable or invalid. Proceed with caution.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
