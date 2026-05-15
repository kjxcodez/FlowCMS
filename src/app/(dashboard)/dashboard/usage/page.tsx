"use client";

import React from "react";
import { 
  Database, 
  Zap, 
  BarChart3,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { useUsage, useUsageRequests } from "@/hooks/use-usage";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";

interface MetricCardProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  icon: React.ElementType;
}

const MetricCard = ({ label, current, max, unit = "", icon: Icon }: MetricCardProps) => {
  const percentage = Math.min(Math.round((current / max) * 100), 100);
  const isHigh = percentage > 80;

  return (
    <Card className="bg-paper border-border rounded-sm overflow-hidden group">
      <CardContent className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-sm bg-canvas border border-border flex items-center justify-center text-ink-muted group-hover:text-accent group-hover:border-accent transition-all">
            <Icon className="size-5" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-ink-muted mb-2">{label}</p>
            <p className="text-3xl font-display font-semibold text-ink">
              {current.toLocaleString()}{unit} <span className="text-sm text-ink-faint font-light">/ {max.toLocaleString()}{unit}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Progress value={percentage} className={cn("h-1 bg-canvas", isHigh && "[&>div]:bg-destructive")} />
          <div className="flex justify-between text-[9px] font-mono font-bold uppercase tracking-[0.2em]">
            <span className={cn(isHigh ? "text-destructive" : "text-ink-muted")}>
              {percentage}% consumed
            </span>
            <span className="text-ink-faint">
              {(max - current).toLocaleString()}{unit} remaining
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function UsagePage() {
  const { data: workspace } = useWorkspace();
  const { data: usage } = useUsage(workspace?.id);
  const { data: requestsData } = useUsageRequests(workspace?.id);

  // Helper for MB/GB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 GB";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const storageGB = (usage?.storageBytes || 0) / (1024 * 1024 * 1024);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="space-y-1.5">
          <h1 className="font-display text-4xl font-semibold text-ink mb-2">
            Usage <em className="italic text-accent not-italic">& Metrics</em>
          </h1>
          <p className="text-ink-muted text-sm max-w-md font-light leading-relaxed">
            Monitor your workspace consumption and API delivery performance in real-time.
          </p>
        </div>
        <Badge variant="outline" className="h-9 px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted bg-paper border-border rounded-sm">
          <Clock className="size-3.5 mr-2 text-ink-faint" />
          Resetting in {30 - new Date().getDate()} days
        </Badge>
      </header>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
          label="API Requests" 
          current={usage?.apiRequests ?? 0} 
          max={5000} 
          icon={Zap} 
        />
        <MetricCard 
          label="Asset Storage" 
          current={Number(storageGB.toFixed(2))} 
          max={5} 
          unit=" GB" 
          icon={Database} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Logs Table */}
        <section className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent-bright" />
              <h2 className="font-display text-2xl font-semibold text-ink">Recent Requests</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:text-ink">
              Export Logs
            </Button>
          </div>

          <Card className="bg-paper border-border rounded-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-border">
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Timestamp</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Endpoint</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Status</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requestsData?.logs?.length ? (
                    requestsData.logs.map((log: any, i: number) => (
                      <tr key={log.id || i} className="text-[11px] font-mono text-ink-muted group hover:bg-canvas transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{format(new Date(log.createdAt), "HH:mm:ss")}</td>
                        <td className="px-6 py-4 text-ink font-medium whitespace-nowrap">{log.endpoint}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider",
                              log.statusCode >= 200 && log.statusCode < 300 ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                            )}
                          >
                            {log.statusCode}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-ink-faint">{log.duration}ms</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[11px] font-mono text-ink-faint">
                        No requests logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Plan Upgrade Sidebar */}
        <aside className="lg:col-span-1">
          <Card className="h-full bg-sidebar border-none rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
               <BarChart3 className="size-48" />
            </div>
            <div className="absolute inset-0 noise-overlay opacity-20" />
            <CardContent className="relative z-10 p-10 space-y-8 flex flex-col h-full">
              <Badge className="w-fit px-3 py-1 bg-accent-bright text-sidebar text-[10px] font-bold uppercase tracking-widest rounded-sm border-none">
                Current Plan: Free
              </Badge>
              <div className="space-y-4">
                <h3 className="font-display text-3xl font-semibold leading-tight text-white">
                  Scaling your <em className="italic text-accent-bright not-italic">digital</em> presence?
                </h3>
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  Upgrade to the Professional plan for unlimited content types, 500k monthly requests, and priority support.
                </p>
              </div>
              <div className="mt-auto space-y-6">
                <Button className="w-full h-12 bg-white text-sidebar text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-accent-bright transition-all shadow-xl">
                  Upgrade Now
                </Button>
                <Link href="#" className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors no-underline">
                  <span>View All Plans</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
