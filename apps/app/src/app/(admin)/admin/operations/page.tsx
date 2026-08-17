import React from "react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { 
  Users, 
  Building2, 
  Layers, 
  FileText, 
  Database, 
  ShieldCheck,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OperationsTools } from "@/components/admin/operations-tools";

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  await requireAdmin();

  const [
    userCount,
    workspaceCount,
    collectionCount,
    entryCount,
    lastUsers,
    activeSubsCount,
    failedHooksCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.collection.count(),
    prisma.entry.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, createdAt: true }
    }),
    prisma.razorpayCustomer.count({
      where: { subscriptionStatus: "active" }
    }),
    prisma.webhookDelivery.count({
      where: { success: false }
    })
  ] as unknown as [number, number, number, number, any[], number, number]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "text-blue-500" },
    { label: "Workspaces", value: workspaceCount, icon: Building2, color: "text-purple-500" },
    { label: "Active Subs", value: activeSubsCount, icon: ShieldCheck, color: "text-emerald-500" },
    { label: "Failed Hooks", value: failedHooksCount, icon: Activity, color: "text-red-500" },
  ];

  return (
    <div className="p-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent-bright uppercase tracking-widest mb-2">
            <ShieldCheck className="size-3" />
            System Operations
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">
            Platform <em className="italic text-accent-bright not-italic">Integrity</em>
          </h1>
          <p className="text-white/40 font-light max-w-xl">
            Global infrastructure overview and real-time consumption metrics across all shards.
          </p>
        </div>
        <div className="flex gap-4">
           <Badge className="h-9 px-4 bg-white/5 border-white/10 text-white font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
             <div className="size-1.5 rounded-full bg-success animate-pulse" />
             Shards: 01-PROD
           </Badge>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-sidebar border-white/5 shadow-2xl hover:border-accent-bright/50 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="size-16" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 flex items-center justify-between">
                {stat.label}
                <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-all" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-semibold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-sidebar border-white/5 shadow-2xl">
           <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
             <div>
               <CardTitle className="text-xl font-display font-semibold text-white">Recent Signups</CardTitle>
               <p className="text-xs text-white/40 mt-1">Latest users registered on the platform.</p>
             </div>
             <Activity className="size-4 text-accent-bright" />
           </CardHeader>
           <CardContent className="p-0">
             <div className="divide-y divide-white/5">
                {lastUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="size-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs group-hover:bg-accent-bright group-hover:text-sidebar transition-all">
                         {u.email[0].toUpperCase()}
                       </div>
                       <div>
                         <p className="text-sm font-medium text-white">{u.email}</p>
                         <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{u.name || "UNIDENTIFIED"}</p>
                       </div>
                    </div>
                    <span className="text-[10px] font-mono text-white/20">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
             </div>
           </CardContent>
        </Card>

        <div className="space-y-8">
          <OperationsTools />

          <Card className="bg-sidebar border-white/5 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-accent-bright" />
             <CardHeader>
               <CardTitle className="text-xl font-display font-semibold text-white">Platform Content</CardTitle>
               <p className="text-xs text-white/40 mt-1">Collections and entries created.</p>
             </CardHeader>
             <CardContent className="space-y-8 py-4">
               <div className="space-y-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">Total Database Entries</span>
                    <span className="text-xs font-bold text-white">{entryCount}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-bright shadow-[0_0_10px_rgba(var(--accent-bright-rgb),0.5)]" 
                      style={{ width: `${Math.min((entryCount / 10000) * 100, 100)}%` }} 
                    />
                  </div>
                  <p className="text-[9px] font-mono text-white/30 mt-1">Scale: 0 - 10,000 items</p>
               </div>

               <Separator className="bg-white/5" />

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="size-4 text-purple-500" />
                      <span className="text-xs font-medium text-white/60">Total Collections</span>
                    </div>
                    <span className="text-xs font-bold text-white">{collectionCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <FileText className="size-4 text-blue-500" />
                       <span className="text-xs font-medium text-white/60">Total Entries</span>
                     </div>
                     <span className="text-xs font-bold text-white">{entryCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <Database className="size-4 text-emerald-500" />
                       <span className="text-xs font-medium text-white/60">System Status</span>
                     </div>
                     <span className={`text-xs font-bold ${failedHooksCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                       {failedHooksCount > 0 ? `${failedHooksCount} Webhook Failures` : "Healthy"}
                     </span>
                  </div>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
