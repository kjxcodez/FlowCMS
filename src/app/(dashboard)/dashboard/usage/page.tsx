"use client";

import React from "react";
import { 
  Activity, 
  Database, 
  Zap, 
  BarChart3,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { useUsage } from "@/hooks/use-usage";
import { cn } from "@/lib/utils";

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
    <div className="p-8 bg-[var(--paper)] border border-[var(--border)] rounded flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded bg-[var(--canvas)] flex items-center justify-center text-[var(--accent)]">
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--ink-muted)] mb-1">{label}</p>
          <p className="text-2xl font-display font-semibold text-[var(--ink)]">
            {current.toLocaleString()}{unit} <span className="text-xs text-[var(--ink-faint)] font-normal">/ {max.toLocaleString()}{unit}</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 bg-[var(--canvas)] rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              isHigh ? "bg-[var(--destructive)]" : "bg-[var(--accent)]"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono font-bold uppercase tracking-widest">
          <span className={cn(isHigh ? "text-[var(--destructive)]" : "text-[var(--ink-muted)]")}>
            {percentage}% consumed
          </span>
          <span className="text-[var(--ink-faint)]">
            {(max - current).toLocaleString()}{unit} remaining
          </span>
        </div>
      </div>
    </div>
  );
};

export default function UsagePage() {
  const { data: usage } = useUsage();

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--ink)] mb-2">
            Usage <em>& Metrics</em>
          </h1>
          <p className="text-[var(--ink-muted)] text-sm max-w-md">
            Monitor your workspace consumption and API delivery performance in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] border border-[var(--border)] rounded">
          <Clock className="w-3.5 h-3.5 text-[var(--ink-faint)]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-muted)]">
            Resetting in 12 days
          </span>
        </div>
      </header>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
          label="API Requests" 
          current={usage?.apiRequests || 1250} 
          max={5000} 
          icon={Zap} 
        />
        <MetricCard 
          label="Asset Storage" 
          current={0.8} 
          max={5} 
          unit=" GB" 
          icon={Database} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Logs Table Placeholder */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="font-display text-xl font-semibold text-[var(--ink)]">Recent Requests</h2>
            </div>
            <button className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">
              Export Logs
            </button>
          </div>

          <div className="bg-[var(--paper)] border border-[var(--border)] rounded overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--canvas)] border-b border-[var(--border)]">
                  <th className="px-6 py-4 font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Timestamp</th>
                  <th className="px-6 py-4 font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Endpoint</th>
                  <th className="px-6 py-4 font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Status</th>
                  <th className="px-6 py-4 font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  { time: "10:42:05", path: "/v1/entries/blog-post", status: 200, latency: "24ms" },
                  { time: "10:38:12", path: "/v1/pages/home", status: 200, latency: "18ms" },
                  { time: "10:35:55", path: "/v1/media", status: 200, latency: "42ms" },
                  { time: "10:30:21", path: "/v1/entries/product", status: 404, latency: "12ms" },
                ].map((log, i) => (
                  <tr key={i} className="text-[11px] font-mono text-[var(--ink-muted)]">
                    <td className="px-6 py-3">{log.time}</td>
                    <td className="px-6 py-3 text-[var(--ink)]">{log.path}</td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-sm",
                        log.status === 200 ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--destructive)]/10 text-[var(--destructive)]"
                      )}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">{log.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Plan Upgrade Sidebar */}
        <aside className="lg:col-span-1 p-8 bg-[var(--sidebar)] text-white rounded relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <BarChart3 className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="inline-block px-2 py-1 bg-[var(--accent-bright)] text-[var(--sidebar)] text-[9px] font-bold uppercase tracking-widest rounded-sm mb-2">
              Current Plan: Free
            </div>
            <h3 className="font-display text-2xl font-semibold leading-tight">
              Scaling your <em>digital</em> presence?
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Upgrade to the Professional plan for unlimited content types, 500k monthly requests, and priority support.
            </p>
            <button className="w-full h-11 bg-white text-[var(--sidebar)] text-[10px] font-bold uppercase tracking-widest rounded hover:bg-[var(--accent-bright)] transition-colors">
              Upgrade Now
            </button>
            <div className="pt-4 flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-widest text-white/40">
              <span>View Plans</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
