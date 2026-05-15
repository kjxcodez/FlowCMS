"use client";

import React, { useState } from "react";
import { 
  Webhook as WebhookIcon, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Activity, 
  Shield, 
  Key,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebhooks } from "@/hooks/use-webhooks";
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

const AVAILABLE_EVENTS = [
  { id: "entry.created", label: "Entry Created", desc: "Triggered when a new entry is created." },
  { id: "entry.updated", label: "Entry Updated", desc: "Triggered when an entry is modified." },
  { id: "entry.published", label: "Entry Published", desc: "Triggered when an entry goes live." },
  { id: "entry.deleted", label: "Entry Deleted", desc: "Triggered when an entry is removed." },
  { id: "collection.created", label: "Collection Created", desc: "Triggered when a new schema is defined." },
  { id: "media.uploaded", label: "Media Uploaded", desc: "Triggered when an asset is uploaded." },
];

export default function WebhooksPage() {
  const { webhooks, isLoading, createWebhook, deleteWebhook } = useWebhooks();
  const { data: workspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["entry.published"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newUrl) return;
    setIsSubmitting(true);
    try {
      await createWebhook({ url: newUrl, events: selectedEvents });
      setIsCreateOpen(false);
      setNewUrl("");
      setSelectedEvents(["entry.published"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const plan = workspace?.plan || "HOBBY";
  const canAccess = plan === "PRO" || plan === "TEAM" || workspace?.isAdmin;

  if (!canAccess) {
    return (
      <div className="p-12 max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-ink">Webhooks</h1>
          <p className="text-ink-muted font-light">Trigger external workflows when content changes.</p>
        </header>

        <Card className="border-accent/20 bg-accent/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <CardHeader className="p-10 pb-6">
            <div className="size-12 rounded-sm bg-accent/10 flex items-center justify-center mb-6">
              <Shield className="size-6 text-accent" />
            </div>
            <CardTitle className="text-2xl font-display font-semibold">Pro Feature</CardTitle>
            <CardDescription className="text-base text-ink-muted leading-relaxed">
              Webhooks are available on <span className="text-accent font-bold">Pro</span> and <span className="text-accent font-bold">Team</span> plans. 
              Upgrade to automate your CI/CD pipelines, trigger Slack notifications, or clear your frontend cache.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0">
             <Button asChild className="h-12 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg">
               <a href="/dashboard/billing">View Plans</a>
             </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent uppercase tracking-widest mb-2">
            <Activity className="size-3" />
            Automation Hub
          </div>
          <h1 className="font-display text-4xl font-bold text-ink tracking-tight">
            Webhooks <em className="italic text-accent not-italic">& Callbacks</em>
          </h1>
          <p className="text-ink-muted font-light max-w-xl">
            Register HTTP endpoints to receive real-time event notifications from your FlowCMS infrastructure.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-xl">
              <Plus className="size-4 mr-2" />
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
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2].map(i => <div key={i} className="h-32 bg-paper animate-pulse border border-border rounded-sm" />)}
        </div>
      ) : webhooks?.length === 0 ? (
        <Card className="bg-canvas border-dashed border-2 border-border py-24 flex flex-col items-center justify-center text-center">
           <div className="size-16 rounded-full bg-paper border border-border flex items-center justify-center mb-8">
             <WebhookIcon className="size-8 text-ink-faint" />
           </div>
           <h3 className="font-display text-2xl font-semibold text-ink mb-2">No Webhooks Found</h3>
           <p className="text-ink-muted font-light max-w-sm mb-8">
             Connect your content to external services like Vercel, Slack, or GitHub Actions.
           </p>
           <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm">
             Register First Endpoint
           </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {webhooks?.map((webhook) => (
            <Card key={webhook.id} className="group bg-paper border-border hover:border-accent hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteWebhook(webhook.id)}
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

                <div className="flex items-center gap-8 px-8 border-l border-border h-full">
                   <div className="text-center">
                      <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint mb-1">Deliveries</p>
                      <p className="text-xl font-display font-bold text-ink">24</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint mb-1">Avg. Latency</p>
                      <p className="text-xl font-display font-bold text-success">142ms</p>
                   </div>
                   <Button variant="ghost" size="icon" asChild>
                      <a href={`/dashboard/webhooks/${webhook.id}`} className="size-10 rounded-full hover:bg-accent/10 hover:text-accent transition-all">
                        <ExternalLink className="size-4" />
                      </a>
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Panel */}
      <section className="pt-12">
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
    </div>
  );
}
