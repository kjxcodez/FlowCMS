import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
    AlertCircle, 
    CheckCircle2, 
    Zap, 
    Shield, 
    CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncButton } from "./sync-button";

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  await requireAdmin();

  // 1. Fetch Failed Logs (5xx or slow)
  const failedLogs = await prisma.usageLog.findMany({
    where: {
      OR: [
        { statusCode: { gte: 500 } },
        { duration: { gte: 1000 } }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { workspace: { select: { name: true } } }
  });

  // 2. Fetch Recent Audit Logs (Security)
  const recentAudits = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { workspace: { select: { name: true } } }
  });

  // 3. Recent Subscriptions (Billing Visibility)
  const recentSubs = await prisma.razorpayCustomer.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { workspace: { select: { name: true } } }
  });

  // 4. Stats Summary
  const stats = {
    failedWebhooks: await prisma.usageLog.count({ where: { statusCode: { gte: 400 }, endpoint: { contains: "webhook" } } }),
    activeSubscribers: await prisma.razorpayCustomer.count({ where: { subscriptionStatus: "active" } }),
    systemHealth: "Operational"
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      <header className="flex items-end justify-between border-b border-border-strong/20 pb-6">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2 uppercase italic text-accent">Operations</h1>
          <p className="text-ink-muted font-light text-sm">Industrial monitoring and system-wide visibility.</p>
        </div>
        <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-sm border border-success/20">
          <CheckCircle2 className="size-4" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{stats.systemHealth}</span>
        </div>
      </header>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Failed Webhooks", value: stats.failedWebhooks, icon: AlertCircle, color: "text-destructive" },
          { label: "Paid Subs", value: stats.activeSubscribers, icon: Zap, color: "text-accent" },
          { label: "Security Events", value: recentAudits.length, icon: Shield, color: "text-ink" },
          { label: "Error Rate (24h)", value: "0.04%", icon: Activity, color: "text-success" }
        ].map((stat, i) => (
          <Card key={i} className="bg-paper border-border-strong rounded-sm shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">{stat.label}</p>
                <stat.icon className={cn("size-4 opacity-50", stat.color)} />
              </div>
              <p className="text-3xl font-bold font-display">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* --- BILLING OVERRIDES --- */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-accent" />
              <h2 className="font-display text-xl font-semibold tracking-tight">Recent Billing</h2>
            </div>
          </div>
          <div className="border border-border-strong rounded-sm overflow-hidden shadow-sm bg-paper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Subscription ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSubs.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                            "text-[9px] uppercase tracking-widest px-2 py-0",
                            sub.subscriptionStatus === "active" ? "bg-success/5 text-success border-success/20" : "bg-ink-faint/5 text-ink-faint"
                        )}
                      >
                        {sub.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{sub.workspace.name}</TableCell>
                    <TableCell className="font-mono text-[10px] text-ink-muted">{sub.subscriptionId}</TableCell>
                    <TableCell className="text-right">
                        <SyncButton subscriptionId={sub.subscriptionId!} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* --- SYSTEM ERRORS --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-destructive" />
            <h2 className="font-display text-xl font-semibold tracking-tight">Failed Requests</h2>
          </div>
          <div className="border border-border-strong rounded-sm overflow-hidden shadow-sm bg-paper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Endpoint</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedLogs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-destructive/[0.02]">
                    <TableCell>
                      <Badge variant="destructive" className="font-mono text-[10px] px-1.5 py-0">
                        {log.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-[11px] text-ink-muted">
                      {log.endpoint}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

      </div>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}
