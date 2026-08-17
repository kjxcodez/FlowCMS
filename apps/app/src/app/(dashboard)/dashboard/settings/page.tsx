"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/internal/workspace")
      .then(res => res.json())
      .then(res => {
        setName(res.data.name);
        setFetching(false);
      });
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/internal/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Workspace updated successfully");
      router.refresh();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/internal/workspace", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Workspace deleted. Redirecting...");
      window.location.href = "/onboarding";
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12 pt-4 px-4">
      <div className="space-y-2">
        <h1 className="text-4xl font-display font-bold tracking-tight">General Settings</h1>
        <p className="text-muted-foreground text-lg">Configure your workspace identity and core preferences.</p>
      </div>

      <Card className="rounded-none border-2 border-border ruled-bg relative overflow-hidden group hover:border-accent/30 transition-colors duration-300">
        <CardHeader className="pb-8">
          <CardTitle className="font-display text-2xl tracking-tight">Workspace Identity</CardTitle>
          <CardDescription className="text-muted-foreground font-medium italic">This name is used across team communications and API identification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-3">
            <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground font-bold">Public Workspace Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="rounded-none border-2 border-border focus-visible:ring-accent tracking-tight font-medium bg-white/80 h-12 text-lg shadow-sm"
              placeholder="e.g. Acme Corp"
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t border-border py-6">
          <Button 
            onClick={handleUpdate} 
            disabled={loading || !name}
            className="rounded-none font-bold uppercase tracking-widest bg-accent hover:bg-accent-dim px-8 h-11"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardFooter>
        <div className="absolute inset-0 pointer-events-none noise-overlay opacity-20" />
      </Card>

      <div className="pt-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-destructive/20" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-destructive font-bold px-2">Danger Zone</span>
          <div className="h-px flex-1 bg-destructive/20" />
        </div>

        <Card className="rounded-none border-2 border-destructive/30 bg-destructive/[0.02] relative overflow-hidden group hover:border-destructive transition-colors duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-2xl tracking-tight text-destructive italic">Delete Workspace</CardTitle>
            <CardDescription className="text-destructive/70 font-medium">Permanently remove this workspace and all associated data.</CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-none">
              <p className="text-sm text-destructive font-bold leading-relaxed">
                WARNING: This action is irreversible. Deleting a workspace will purge all content types, entries, media files, and revoke all active API keys. Team members will lose access immediately.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-destructive/5 border-t border-destructive/10 py-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="rounded-none font-bold uppercase tracking-widest px-8 h-11 hover:scale-105 transition-transform">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-none border-2 border-border shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-3xl tracking-tight text-destructive">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-muted-foreground leading-relaxed pt-2">
                    This will permanently delete the <strong className="text-ink underline decoration-destructive decoration-2">{name}</strong> workspace. 
                    There is no way to recover your data once this is done.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-6">
                  <AlertDialogCancel className="rounded-none uppercase font-bold tracking-widest border-2">Keep Workspace</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="rounded-none bg-destructive hover:bg-destructive/90 text-white uppercase font-bold tracking-widest px-8"
                  >
                    {deleting ? "Processing..." : "Yes, Delete Everything"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
          <div className="absolute inset-0 pointer-events-none noise-overlay opacity-10" />
        </Card>
      </div>
    </div>
  );
}
