"use client"

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  User as UserIcon,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { getPlanConfig } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DATE_RANGES = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
];

const getActionStyle = (action: string) => {
  if (action.includes("CREATE") || action.includes("INVITE")) 
    return "bg-success/10 text-success border-success/20";
  if (action.includes("DELETE") || action.includes("REVOKE") 
    || action.includes("SUSPEND"))
    return "bg-destructive/10 text-destructive border-destructive/20";
  if (action.includes("PUBLISH"))
    return "bg-accent/10 text-accent border-accent/20";
  if (action.includes("UPDATE") || action.includes("RESTORE"))
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (action.includes("PLAN_CHANGED"))
    return "bg-orange-400/10 text-orange-400 border-orange-400/20";
  return "bg-ink-muted/10 text-ink-muted border-border";
};

export default function AuditLogsPage() {
  const { data: workspace } = useWorkspace();
  const [dateRange, setDateRange] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: logs, isLoading } = useAuditLogs(workspace?.id, { 
    days: dateRange,
    query: searchQuery 
  });
  const [diffLog, setDiffLog] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  
  const plan = workspace?.plan ?? "HOBBY";
  const isLocked = !getPlanConfig(plan).auditLogs;

  const handleExport = () => {
    if (!logs) return;
    const blob = new Blob(
      [JSON.stringify(logs, null, 2)], 
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="py-32 text-center font-mono text-[10px] uppercase tracking-widest opacity-30 animate-pulse">Scanning Security Logs...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="space-y-1.5">
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            Audit <em className="italic text-accent not-italic">Logs</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Track all administrative actions, content updates, and infrastructure changes across your workspace.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExport}
            variant="outline" 
            className="h-10 text-[10px] font-bold uppercase tracking-widest border-border text-ink-muted hover:text-ink"
          >
            Export JSON
          </Button>
          <Button variant="outline" className="h-10 text-[10px] font-bold uppercase tracking-widest border-border text-ink-muted hover:text-ink">
            <Filter className="size-3.5 mr-2 opacity-50" />
            Filters
          </Button>
        </div>
      </header>

      {isLocked ? (
        <Card className="bg-sidebar border-none rounded-sm p-24 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 noise-overlay opacity-20" />
          <div className="relative z-10 space-y-8 max-w-lg">
             <div className="size-20 rounded-full bg-paper/10 border border-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-2xl">
                <ShieldCheck className="size-10 text-accent-bright" />
             </div>
             <div className="space-y-4">
                <h2 className="font-display text-3xl font-semibold text-white">Advanced Security <em className="italic text-accent-bright not-italic">Gating</em></h2>
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  Audit logs provide granular visibility into workspace activity for compliance and security auditing. This feature is exclusive to Agency and Enterprise plans.
                </p>
             </div>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button className="h-12 px-8 bg-white text-sidebar text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-accent-bright transition-all shadow-xl w-full sm:w-auto">
                   Upgrade to Agency
                </Button>
                <Button variant="outline" className="h-12 px-8 border-white/20 text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest rounded-sm w-full sm:w-auto">
                   Compare Plans
                </Button>
             </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-paper border border-border p-2 rounded-sm mb-8">
            <div className="flex-1 flex items-center px-4 gap-3">
              <Search className="size-4 text-ink-faint" />
              <input 
                placeholder="Search logs by action, resource, or user..." 
                className="w-full bg-transparent border-none py-2 text-sm text-ink outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="h-8 w-px bg-border/50" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                  {DATE_RANGES.find(r => r.days === dateRange)?.label}
                  <ChevronDown className="ml-2 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-paper border-border rounded-none min-w-[150px]">
                {DATE_RANGES.map(range => (
                  <DropdownMenuItem 
                    key={range.days}
                    onClick={() => setDateRange(range.days)}
                    className="text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-canvas"
                  >
                    {range.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card className="bg-paper border-border rounded-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-border">
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Timestamp</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Action</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Resource</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">User / Actor</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs?.map((log: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <tr key={log.id || i} className="text-[11px] font-mono text-ink-muted group hover:bg-canvas transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-ink-faint">
                        {format(new Date(log.createdAt), "MMM dd, HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider",
                            getActionStyle(log.action)
                          )}
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className="text-ink font-medium">{log.resourceType}:</span>
                           <span className="text-ink-muted truncate max-w-[120px]">{log.resourceName || log.resourceId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="size-5 rounded-full bg-canvas border border-border flex items-center justify-center">
                              <UserIcon className="size-2.5 text-ink-faint" />
                           </div>
                           <span className="text-ink truncate max-w-[120px]">
                             {log.user?.name || log.user?.email || "System"}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(log.before || log.after) && (
                          <button 
                            onClick={() => setDiffLog(log)}
                            className="text-[9px] font-bold uppercase tracking-widest text-accent hover:underline"
                          >
                            View Diff
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {(!logs || logs.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[11px] font-mono text-ink-faint italic">
                        No activity logs found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={!!diffLog} onOpenChange={() => setDiffLog(null)}>
        <DialogContent className="max-w-4xl bg-paper border-2 border-border rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {diffLog?.action} — {diffLog?.resourceType}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Before</p>
              <pre className="bg-canvas p-4 rounded-none text-[11px] font-mono overflow-auto max-h-96 border border-border">
                {diffLog?.before 
                  ? JSON.stringify(diffLog.before, null, 2)
                  : "No snapshot"}
              </pre>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">After</p>
              <pre className="bg-canvas p-4 rounded-none text-[11px] font-mono overflow-auto max-h-96 border border-border">
                {diffLog?.after 
                  ? JSON.stringify(diffLog.after, null, 2)
                  : "No snapshot"}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
