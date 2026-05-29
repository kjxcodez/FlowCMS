"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Activity, 
  Globe,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebhooks } from "@/hooks/use-webhooks";
import { Webhook } from "@/generated/prisma";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";

const AVAILABLE_EVENTS = [
  { id: "ENTRY_CREATED", label: "Entry Created", desc: "Triggered when a new entry is created." },
  { id: "ENTRY_UPDATED", label: "Entry Updated", desc: "Triggered when an entry is modified." },
  { id: "ENTRY_PUBLISHED", label: "Entry Published", desc: "Triggered when an entry goes live." },
  { id: "ENTRY_DELETED", label: "Entry Deleted", desc: "Triggered when an entry is removed." },
  { id: "COLLECTION_CREATED", label: "Collection Created", desc: "Triggered when a new collection is created." },
  { id: "COLLECTION_UPDATED", label: "Collection Updated", desc: "Triggered when a collection is modified." },
  { id: "COLLECTION_DELETED", label: "Collection Deleted", desc: "Triggered when a collection is deleted." },
  { id: "MEDIA_UPLOADED", label: "Media Uploaded", desc: "Triggered when an asset is uploaded." },
  { id: "MEDIA_UPDATED", label: "Media Updated", desc: "Triggered when an asset is modified." },
  { id: "MEDIA_DELETED", label: "Media Deleted", desc: "Triggered when an asset is deleted." },
];

export default function WebhooksPage() {
  const { webhooks, isLoading, createWebhook, deleteWebhook } = useWebhooks();
  const { data: workspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["ENTRY_PUBLISHED"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newUrl) return;
    setIsSubmitting(true);
    try {
      await createWebhook({ url: newUrl, events: selectedEvents });
      setIsCreateOpen(false);
      setNewUrl("");
      setSelectedEvents(["ENTRY_PUBLISHED"]);
      toast.success("Webhook endpoint registered successfully!");
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(e?.message || "Failed to create webhook.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    toast.success("Webhook signing secret copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const plan = workspace?.plan || "HOBBY";
  const isHobby = plan === "HOBBY" && !workspace?.isAdmin;
  const webhookCount = webhooks?.length || 0;
  const isLimitReached = isHobby && webhookCount >= 1;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent uppercase tracking-widest mb-2">
            <Activity className="size-3" />
            Automation Hub
          </div>
          <h1 className="font-display text-4xl font-bold text-ink tracking-tight">
            Webhooks <em className="italic text-accent not-italic">& Callbacks</em>
          </h1>
          <p className="text-ink-muted font-light max-w-xl text-sm leading-relaxed">
            Register HTTP endpoints to receive real-time event notifications from your FlowCMS infrastructure.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={isLimitReached}
                className="h-12 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-xl"
              >
                {isLimitReached ? <Lock className="size-3.5 mr-2" /> : <Plus className="size-4 mr-2" />}
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-paper border-border rounded-sm p-0 overflow-hidden">
              <DialogHeader className="p-10 pb-6 bg-canvas border-b border-border">
                <DialogTitle className="font-display text-2xl font-semibold">New Webhook</DialogTitle>
                <DialogDescription className="text-ink-muted">Configure a new destination for your content events.</DialogDescription>
              </DialogHeader>
              <div className="p-10 space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-muted">Payload URL</Label>
                  <Input 
                    placeholder="https://your-api.com/webhooks/flowcms" 
                    className="bg-canvas border-border h-12"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-muted">Event Selection</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_EVENTS.map((event) => (
                      <div 
                        key={event.id}
                        className={cn(
                          "p-4 rounded-sm border transition-all cursor-pointer flex items-start gap-3",
                          selectedEvents.includes(event.id) 
                            ? "bg-accent/5 border-accent shadow-sm" 
                            : "bg-canvas border-border hover:border-accent/30"
                        )}
                        onClick={() => {
                          setSelectedEvents(prev => 
                            prev.includes(event.id) 
                              ? prev.filter(e => e !== event.id) 
                              : [...prev, event.id]
                          );
                        }}
                      >
                        <Checkbox 
                          checked={selectedEvents.includes(event.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-[12px] font-bold text-ink">{event.label}</p>
                          <p className="text-[10px] text-ink-muted font-light mt-0.5">{event.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="p-10 pt-0">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsCreateOpen(false)}
                  className="text-[11px] font-bold uppercase tracking-widest"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={isSubmitting || !newUrl}
                  className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg"
                >
                  {isSubmitting ? "Creating..." : "Initialize Webhook"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Warning Box for Hobby users who reached limit */}
      {isLimitReached && (
        <section className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-sm flex gap-4 relative overflow-hidden">
          <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5 relative z-10">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-500">Hobby Plan Limitation</h4>
            <p className="text-xs text-ink-muted leading-relaxed font-light">
              Your workspace is currently using the 1 allocated webhook under the Hobby plan. Upgrade to a Pro plan to connect unlimited endpoints.
            </p>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2].map(i => <div key={i} className="h-32 bg-paper animate-pulse border border-border rounded-sm" />)}
        </div>
      ) : webhooks?.length === 0 ? (
        <Card className="bg-paper border border-border shadow-xl rounded-sm max-w-4xl mx-auto overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 graph-bg opacity-[0.04]" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 relative z-10">
            {/* Left side: Guide & Action */}
            <div className="md:col-span-7 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="size-3 animate-pulse" />
                  Real-time synchronization
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-display text-2xl font-bold text-ink">
                    Automate Outbound <em className="italic text-accent not-italic">Workflows</em>
                  </h3>
                  <p className="text-ink-muted text-sm font-light leading-relaxed">
                    Trigger headless page rebuilds, sync elastic indexes, deploy serverless callbacks, or trigger custom notification scripts instantly when your content schemas or document entries are modified.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">1</div>
                    <div>
                      <h4 className="text-[12px] font-bold text-ink">Register Your Destination URL</h4>
                      <p className="text-[10px] text-ink-muted font-light mt-0.5">Provide any standard secure HTTPS callback endpoint.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">2</div>
                    <div>
                      <h4 className="text-[12px] font-bold text-ink">HMAC-SHA256 Integrity Verification</h4>
                      <p className="text-[10px] text-ink-muted font-light mt-0.5">Cryptographically verify headers to protect against endpoint spoofing.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">3</div>
                    <div>
                      <h4 className="text-[12px] font-bold text-ink">Track Callback Deliveries & Latency</h4>
                      <p className="text-[10px] text-ink-muted font-light mt-0.5">View real-time attempt statuses, HTTP response logs, and failures.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <Button 
                  onClick={() => setIsCreateOpen(true)} 
                  className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-xl"
                >
                  <Plus className="size-4 mr-2" />
                  Register First Endpoint
                </Button>
              </div>
            </div>

            {/* Right side: visual depiction of event streaming */}
            <div className="md:col-span-5 bg-canvas/40 p-10 flex flex-col justify-center relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-faint">
                  Active Webhook Streams
                </h4>
                
                {/* Visual nodes showing a publish event going to a destination */}
                <div className="space-y-4 font-mono text-[10px]">
                  <div className="p-3 bg-paper border border-border rounded-sm flex items-center justify-between shadow-sm hover:border-accent/30 transition-all">
                    <span className="text-accent font-bold">ENTRY_PUBLISHED</span>
                    <span className="text-ink-faint">&rarr; Vercel ISR Hook</span>
                  </div>
                  <div className="p-3 bg-paper border border-border rounded-sm flex items-center justify-between shadow-sm hover:border-accent/30 transition-all opacity-70">
                    <span className="text-accent font-bold">MEDIA_UPLOADED</span>
                    <span className="text-ink-faint">&rarr; Algolia Sync</span>
                  </div>
                  <div className="p-3 bg-paper border border-border rounded-sm flex items-center justify-between shadow-sm hover:border-accent/30 transition-all opacity-45">
                    <span className="text-accent font-bold">COLLECTION_CREATED</span>
                    <span className="text-ink-faint">&rarr; Discord Alert</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-sm text-[10px] text-ink-muted leading-relaxed font-light">
                  <Activity className="size-3.5 text-amber-500 mb-1 inline mr-1" />
                  QStash-backed queues automatically retry failed endpoints up to 3 times with exponential backoff.
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {webhooks?.map((webhook: Webhook) => (
            <Card key={webhook.id} className="group bg-paper border-border hover:border-accent hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this webhook callback?")) {
                      deleteWebhook(webhook.id);
                    }
                  }}
                  className="size-10 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-sm bg-canvas border border-border flex items-center justify-center text-accent group-hover:border-accent transition-colors">
                       <Globe className="size-5" />
                     </div>
                     <div>
                       <h4 className="text-lg font-display font-semibold text-ink flex items-center gap-2">
                         {webhook.url}
                         {webhook.enabled ? (
                           <Badge className="bg-success/10 text-success border-success/20 text-[9px] font-bold uppercase h-4">Live</Badge>
                         ) : (
                           <Badge variant="outline" className="text-[9px] font-bold uppercase h-4">Paused</Badge>
                         )}
                       </h4>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-mono text-ink-faint uppercase tracking-widest">Secret Key:</span>
                         <code className="text-[10px] font-mono text-ink-muted bg-canvas px-1.5 py-0.5 rounded border border-border">
                           {copiedId === webhook.id ? "Copied!" : `${webhook.secret.substring(0, 8)}••••••••`}
                         </code>
                         <button 
                           onClick={() => copySecret(webhook.secret, webhook.id)}
                           className="p-1 hover:text-accent transition-colors"
                         >
                           {copiedId === webhook.id ? <Check className="size-3" /> : <Copy className="size-3" />}
                         </button>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                     {(webhook.events as string[]).map(event => (
                       <Badge key={event} variant="outline" className="text-[9px] font-mono uppercase tracking-widest border-border text-ink-muted">
                         {event}
                       </Badge>
                     ))}
                  </div>
                </div>

                <div className="flex items-center gap-8 px-8 border-l border-border h-full md:min-w-[280px] justify-end">
                   <div className="text-center">
                      <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint mb-1">Deliveries</p>
                      <p className="text-sm font-mono text-ink-muted">No fires logged</p>
                   </div>
                   <div className="text-center ml-4">
                      <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint mb-1">Latency</p>
                      <p className="text-sm font-mono text-ink-muted">—</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Panel */}
      <section className="pt-6">
         <Card className="bg-canvas border-border-strong/10 rounded-sm p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8">
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-4 text-accent" />
                    <h4 className="text-sm font-bold uppercase tracking-widest text-ink">Payload Verification</h4>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed font-light">
                    Every webhook request includes a <code className="text-accent">x-flowcms-signature</code> header. 
                    Use your secret key to verify the HMAC-SHA256 signature and ensure the request originated from our servers.
                  </p>
               </div>
               <Separator className="hidden md:block h-20 w-px bg-border" />
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-4 text-success" />
                    <h4 className="text-sm font-bold uppercase tracking-widest text-ink">Retry Policy</h4>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed font-light">
                    If your endpoint returns anything other than a 2xx status code, we will automatically retry the delivery 
                    with exponential backoff for up to 24 hours.
                  </p>
               </div>
            </div>
         </Card>
      </section>

      {/* Upgrade Callout */}
      {isHobby && (
        <Card className="bg-sidebar border-none rounded-sm p-10 relative overflow-hidden group">
          <div className="absolute inset-0 noise-overlay opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
               <h3 className="font-display text-2xl font-semibold text-white flex items-center gap-2">
                 Need multiple webhooks?
                 <Sparkles className="size-5 text-accent-bright animate-pulse" />
               </h3>
               <p className="text-sm text-white/50 leading-relaxed font-light">
                 Hobby tier is configured for a single destination callback endpoint. Upgrade to Pro or Team plans to unlock unlimited webhooks and multi-server CDNs.
               </p>
            </div>
            <Button asChild className="h-12 px-8 bg-white text-sidebar text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-accent-bright transition-all shadow-xl whitespace-nowrap">
              <a href="/dashboard/billing">Upgrade Plan</a>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
