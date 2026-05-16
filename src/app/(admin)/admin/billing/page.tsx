import React from "react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { 
  CreditCard, 
  Search, 
  Filter, 
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Activity
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OperationsTools } from "@/components/admin/operations-tools";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  await requireAdmin();

  const customers = await prisma.razorpayCustomer.findMany({
    include: { workspace: true },
    orderBy: { updatedAt: "desc" },
    take: 50
  });

  return (
    <div className="p-12 space-y-12 animate-in fade-in duration-700">
      <header className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent-bright uppercase tracking-widest mb-2">
          <CreditCard className="size-3" />
          Revenue Operations
        </div>
        <h1 className="font-display text-4xl font-bold text-white tracking-tight">
          Global <em className="italic text-accent-bright not-italic">Billing</em>
        </h1>
        <p className="text-white/40 font-light max-w-xl">
          Subscription lifecycle management, revenue recovery, and payment reconciliation tools.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="border border-white/5 rounded-sm overflow-hidden bg-sidebar shadow-2xl">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Workspace</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Plan ID</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4 text-right">Last Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white">{c.workspace.name}</span>
                          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{c.workspace.slug}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-bold px-2 py-0 h-5 uppercase tracking-widest",
                        c.subscriptionStatus === "active" ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/20" : 
                        c.subscriptionStatus === "cancelled" ? "bg-red-500/20 text-red-500 border-red-500/20" :
                        "bg-white/5 text-white/40 border-white/10"
                      )}>
                        {c.subscriptionStatus || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-white/60">
                      {c.planId || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[10px] text-white/20">
                      {c.lastEventAt ? new Date(c.lastEventAt).toLocaleDateString() : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-8">
           <OperationsTools />
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
