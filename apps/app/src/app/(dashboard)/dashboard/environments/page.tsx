"use client";

import React, { useState } from "react";
import { 
  GitBranch, 
  Plus, 
  ChevronRight,
  Info,
  Lock,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/hooks/use-workspace";
import { useEnvironments } from "@/hooks/use-environments";
import { getPlanConfig } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EnvironmentsPage() {
  const { data: workspace } = useWorkspace();
  const { 
    data: environments, 
    isLoading,
    createEnvironment,
    setDefaultEnvironment,
    updateEnvironment,
    deleteEnvironment
  } = useEnvironments();

  const plan = workspace?.plan ?? "HOBBY";
  const limits = getPlanConfig(plan);
  const maxEnvironments = limits.environments;
  const canCreateMore = maxEnvironments === -1 || (environments?.length ?? 0) < maxEnvironments;
  const isHobby = maxEnvironments === 1;

  // New Environment Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [isCreatingEnv, setIsCreatingEnv] = useState(false);

  // Settings Dialog State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [editEnvName, setEditEnvName] = useState("");
  const [isUpdatingEnv, setIsUpdatingEnv] = useState(false);
  const [isDeletingEnv, setIsDeletingEnv] = useState(false);

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    setIsCreatingEnv(true);
    try {
      await createEnvironment({ name: newEnvName.trim() });
      toast.success("Environment created successfully!");
      setIsCreateOpen(false);
      setNewEnvName("");
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message || "Failed to create environment");
    } finally {
      setIsCreatingEnv(false);
    }
  };

  const handleSetDefault = async (envId: string) => {
    try {
      await setDefaultEnvironment(envId);
      toast.success("Default environment updated successfully!");
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message || "Failed to update default environment");
    }
  };

  const handleUpdateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnv || !editEnvName.trim()) return;
    setIsUpdatingEnv(true);
    try {
      await updateEnvironment({ envId: selectedEnv.id, name: editEnvName.trim() });
      toast.success("Environment renamed successfully!");
      setIsSettingsOpen(false);
      setSelectedEnv(null);
      setEditEnvName("");
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message || "Failed to rename environment");
    } finally {
      setIsUpdatingEnv(false);
    }
  };

  const handleDeleteEnvironment = async () => {
    if (!selectedEnv) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the "${selectedEnv.name}" environment? This action cannot be undone.`);
    if (!confirmDelete) return;

    setIsDeletingEnv(true);
    try {
      await deleteEnvironment(selectedEnv.id);
      toast.success("Environment deleted successfully!");
      setIsSettingsOpen(false);
      setSelectedEnv(null);
      setEditEnvName("");
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message || "Failed to delete environment");
    } finally {
      setIsDeletingEnv(false);
    }
  };

  if (isLoading) return <div className="py-32 text-center font-mono text-[10px] uppercase tracking-widest opacity-30 animate-pulse">Mapping Infrastructure...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="space-y-1.5">
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            Workspace <em className="italic text-accent not-italic">Environments</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Isolate your content development workflow with staging and production environments.
          </p>
        </div>
        
        <div className="relative group">
          {!canCreateMore && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-xl z-20 whitespace-nowrap">
              {maxEnvironments === 1 ? "Upgrade to Pro for more environments" : "Environment limit reached for your plan"}
            </div>
          )}
          <Button 
            disabled={!canCreateMore}
            onClick={() => setIsCreateOpen(true)}
            className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg"
          >
            {!canCreateMore ? <Lock className="size-3.5 mr-2" /> : <Plus className="size-4 mr-2" />}
            New Environment
          </Button>
        </div>
      </header>

      {/* Environments List */}
      <div className="space-y-6">
        {environments?.map((env: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <Card key={env.id} className="bg-paper border-border rounded-sm overflow-hidden group hover:border-accent transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center p-8 gap-8">
                <div className="w-14 h-14 rounded-sm bg-canvas border border-border flex items-center justify-center shrink-0">
                   <GitBranch className={cn("size-6", env.isDefault ? "text-accent" : "text-ink-faint")} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-xl font-semibold text-ink">{env.name}</h3>
                    {env.isDefault && (
                      <Badge className="bg-success/10 text-success border-success/20 rounded-sm text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">Slug: {env.slug}</p>
                </div>

                <div className="flex items-center gap-12 px-12 border-x border-border/50">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-faint">Entries</p>
                    <p className="text-lg font-display font-semibold text-ink">{env._count?.entries || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!env.isDefault && (
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSetDefault(env.id)}
                      className="h-9 text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-accent"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedEnv(env);
                      setEditEnvName(env.name);
                      setIsSettingsOpen(true);
                    }}
                    className="h-9 text-[10px] font-bold uppercase tracking-widest border-border text-ink-muted hover:text-ink"
                  >
                    Settings
                  </Button>
                </div>
              </div>

              {/* Promo Banner for Promotion flow */}
              <div className="px-8 py-4 bg-canvas/30 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-faint">
                  <Zap className="size-3.5 text-accent opacity-50" />
                  Promotion Flow: <span className="opacity-40 italic">Coming Soon</span>
                </div>
                <ChevronRight className="size-4 text-ink-faint opacity-20" />
              </div>
            </CardContent>
          </Card>
        ))}

        {(!environments || environments.length === 0) && (
          <div className="py-32 text-center bg-canvas/30 rounded-sm border border-dashed border-border flex flex-col items-center justify-center gap-6">
             <div className="size-16 rounded-full bg-paper border border-border flex items-center justify-center text-ink-faint">
                <Info className="size-8" />
             </div>
             <div className="space-y-2">
                <p className="text-ink font-semibold">No environments found</p>
                <p className="text-sm text-ink-muted font-light">Every workspace needs at least one environment to store content.</p>
             </div>
          </div>
        )}
      </div>

      {/* Upgrade Callout */}
      {isHobby && (
        <Card className="bg-sidebar border-none rounded-sm p-10 relative overflow-hidden group">
          <div className="absolute inset-0 noise-overlay opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
               <h3 className="font-display text-2xl font-semibold text-white">Need a <em className="italic text-accent-bright not-italic">Staging</em> environment?</h3>
               <p className="text-sm text-white/50 leading-relaxed font-light">
                 Hobby plans are limited to a single production environment. Upgrade to Pro or Agency to unlock multiple environments and Promotion Flows.
               </p>
            </div>
            <Link href="/dashboard/billing" passHref legacyBehavior>
              <Button asChild className="h-12 px-8 bg-white text-sidebar text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-accent-bright transition-all shadow-xl whitespace-nowrap">
                 <a>Upgrade Plan</a>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px] bg-paper border-border rounded-sm">
          <form onSubmit={handleCreateEnvironment}>
            <DialogHeader className="space-y-3">
              <DialogTitle className="font-display text-2xl font-bold text-ink">New Environment</DialogTitle>
              <DialogDescription className="text-ink-muted text-xs font-light">
                Create a new environment to isolate your content (e.g. Staging, Development).
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">Environment Name</Label>
                <Input
                  id="name"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  placeholder="e.g. Staging"
                  required
                  className="bg-canvas border-border focus:border-accent rounded-sm h-11 text-ink text-sm placeholder:text-ink-faint"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="h-11 px-6 text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingEnv || !newEnvName.trim()}
                className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg"
              >
                {isCreatingEnv ? "Creating..." : "Create Environment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={(open) => {
        setIsSettingsOpen(open);
        if (!open) {
          setSelectedEnv(null);
          setEditEnvName("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-paper border-border rounded-sm">
          <form onSubmit={handleUpdateEnvironment}>
            <DialogHeader className="space-y-3">
              <DialogTitle className="font-display text-2xl font-bold text-ink">Environment Settings</DialogTitle>
              <DialogDescription className="text-ink-muted text-xs font-light">
                Configure properties and manage settings for this environment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">Environment Name</Label>
                <Input
                  id="edit-name"
                  value={editEnvName}
                  onChange={(e) => setEditEnvName(e.target.value)}
                  placeholder="e.g. Staging"
                  required
                  className="bg-canvas border-border focus:border-accent rounded-sm h-11 text-ink text-sm placeholder:text-ink-faint"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
              {selectedEnv && !selectedEnv.isDefault && selectedEnv.slug !== "production" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteEnvironment}
                  disabled={isDeletingEnv || isUpdatingEnv}
                  className="h-11 px-6 text-[10px] font-bold uppercase tracking-widest text-danger hover:bg-danger/10 self-start sm:mr-auto"
                >
                  {isDeletingEnv ? "Deleting..." : "Delete"}
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSettingsOpen(false)}
                  className="h-11 px-6 text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-ink"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingEnv || isDeletingEnv || !editEnvName.trim() || editEnvName.trim() === selectedEnv?.name}
                  className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg"
                >
                  {isUpdatingEnv ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
