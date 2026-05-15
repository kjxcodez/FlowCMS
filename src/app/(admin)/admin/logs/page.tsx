import React from "react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { 
  Database, 
  Terminal, 
  Clock, 
  Zap, 
  Activity,
  History,
  AlertCircle,
  ExternalLink
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
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  await requireAdmin();

  const [usageLogs, auditLogs] = await Promise.all([
    prisma.usageLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { workspace: true }
    }),
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { workspace: true, user: true }
    })
  ]);

  return (
    <div className="p-12 space-y-12">
      <header className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent-bright uppercase tracking-widest mb-2">
          <Terminal className="size-3" />
          Stream 01: Audit & Execution
        </div>
        <h1 className="font-display text-4xl font-bold text-white tracking-tight">
          System <em className="italic text-accent-bright not-italic">Logs</em>
        </h1>
        <p className="text-white/40 font-light max-w-xl">
          Real-time telemetry from the content delivery network and internal management actions.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Usage Logs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-semibold text-white flex items-center gap-3">
              <Zap className="size-5 text-amber-500" />
              API Requests
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] text-white/30 border-white/5 uppercase tracking-widest">Live CDN Stream</Badge>
          </div>
          
          <div className="border border-white/5 rounded-sm overflow-hidden bg-sidebar shadow-2xl">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Method</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Endpoint</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Workspace</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4 text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLogs.map((log) => (
                  <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell>
                      <Badge className={cn(
                        "text-[10px] font-bold px-2 py-0 h-5",
                        log.statusCode < 300 ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/20" : 
                        log.statusCode < 400 ? "bg-amber-500/20 text-amber-500 border-amber-500/20" : 
                        "bg-red-500/20 text-red-500 border-red-500/20"
                      )}>
                        {log.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] font-bold text-white/60">
                      {log.method}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      <span className="text-[12px] font-medium text-white/80" title={log.endpoint}>
                        {log.endpoint}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white/60">{log.workspace.name}</span>
                        <span className="text-[9px] font-mono text-white/20 uppercase">{log.workspace.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-mono text-[10px] font-bold",
                        log.duration > 500 ? "text-amber-500" : "text-white/40"
                      )}>
                        {log.duration}ms
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Audit Logs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-semibold text-white flex items-center gap-3">
              <History className="size-5 text-accent-bright" />
              Audit Trail
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] text-white/30 border-white/5 uppercase tracking-widest">Internal Operations</Badge>
          </div>

          <div className="border border-white/5 rounded-sm overflow-hidden bg-sidebar shadow-2xl">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Action</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">User</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4">Resource</TableHead>
                  <TableHead className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 py-4 text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white">{log.action.replace(/_/g, ' ')}</span>
                          <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{log.entityType}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                          {log.user?.email?.[0].toUpperCase() || "?"}
                        </div>
                        <span className="text-[11px] text-white/60">{log.user?.email || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-white/40 truncate max-w-[100px]">{log.workspace.name}</span>
                        <span className="text-[9px] font-mono text-white/20">{log.entityId.substring(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <span className="text-[10px] font-mono text-white/20 whitespace-nowrap">
                         {new Date(log.createdAt).toLocaleTimeString()}
                       </span>
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
