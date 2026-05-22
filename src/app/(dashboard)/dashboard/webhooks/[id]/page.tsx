import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Activity,
  Code,
  Globe
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function WebhookDetailsPage({ params }: { params: { id: string } }) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const webhook = await prisma.webhook.findFirst({
    where: { id, workspaceId: workspace.id },
  });

  if (!webhook) notFound();

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-12 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-6">
        <Button variant="ghost" asChild className="p-0 hover:bg-transparent text-ink-muted hover:text-accent group">
          <Link href="/dashboard/webhooks" className="flex items-center gap-2">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Back to Hub</span>
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <Globe className="size-6 text-accent" />
               <h1 className="font-display text-4xl font-bold text-ink">{webhook.url}</h1>
            </div>
            <p className="text-ink-muted font-light">Delivery history and payload logs for this endpoint.</p>
          </div>
          <Badge className={webhook.enabled ? "bg-success/10 text-success border-success/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}>
            {webhook.enabled ? "ACTIVE" : "PAUSED"}
          </Badge>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="font-display text-xl font-semibold text-ink flex items-center gap-3">
            <Activity className="size-4 text-accent" />
            Recent Deliveries
          </h3>
          
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <div className="p-12 bg-canvas border border-dashed border-border rounded-sm text-center">
                <p className="text-sm text-ink-muted">No delivery attempts recorded yet.</p>
              </div>
            ) : (
              deliveries.map((log) => (
                <Card key={log.id} className="bg-paper border-border hover:border-accent/30 transition-colors overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 bg-canvas/30 border-b border-border">
                      <div className="flex items-center gap-4">
                        {log.success ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : (
                          <XCircle className="size-4 text-destructive" />
                        )}
                        <span className="font-mono text-[11px] font-bold text-ink">{log.event}</span>
                        <Badge variant="outline" className="text-[9px] font-mono border-border">
                          {log.statusCode}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono text-ink-faint">
                        {format(new Date(log.createdAt), "MMM dd, HH:mm:ss")}
                      </span>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Code className="size-3 text-ink-faint" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-muted">Payload</span>
                      </div>
                      <pre className="bg-[#0F1109] p-4 rounded-sm text-[10px] font-mono text-white/70 overflow-auto max-h-48 custom-scrollbar">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="font-display text-xl font-semibold text-ink">Configuration</h3>
          <Card className="bg-canvas border-border-strong/10 p-6 space-y-6">
             <div className="space-y-2">
               <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint">Events Subscribed</p>
               <div className="flex flex-wrap gap-2">
                 {(webhook.events as string[]).map(e => (
                   <Badge key={e} variant="outline" className="text-[9px] font-mono border-border text-ink-muted">{e}</Badge>
                 ))}
               </div>
             </div>
             <div className="space-y-2">
               <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink-faint">Created At</p>
               <p className="text-xs text-ink">{format(new Date(webhook.createdAt), "PPP")}</p>
             </div>
             <div className="pt-4 border-t border-border">
               <div className="flex items-center gap-3 text-amber-500">
                  <Clock className="size-4" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Retry Policy: Active</p>
               </div>
             </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
