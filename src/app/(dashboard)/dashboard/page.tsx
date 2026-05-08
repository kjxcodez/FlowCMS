"use client";

import React from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Activity, 
  ArrowUpRight,
  Plus,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";


interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href: string;
  isLoading?: boolean;
}

const StatCard = ({ label, value, icon: Icon, href, isLoading }: StatCardProps) => (
  <Link href={href} className="group no-underline">
    <Card className="bg-paper border-border rounded-sm hover:border-accent hover:shadow-xl transition-all duration-300 overflow-hidden relative">
      <CardContent className="p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-sm bg-canvas border border-border flex items-center justify-center text-ink-muted group-hover:text-accent group-hover:border-accent transition-all">
            <Icon className="size-5" />
          </div>
          <ArrowUpRight className="size-4 text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-2">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="font-display text-4xl font-semibold text-ink">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  </Link>
);

interface UsageBarProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
}

const UsageBar = ({ label, current, max, unit = "" }: UsageBarProps) => {
  const percentage = Math.min(Math.round((current / max) * 100), 100);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          {label}
        </span>
        <span className="text-[12px] font-semibold text-ink">
          {current} <span className="text-ink-muted font-light">/</span> {max} {unit}
        </span>
      </div>
      <Progress value={percentage} className="h-1 bg-canvas" />
    </div>
  );
};

export default function DashboardOverview() {
  const { data: session } = useSession();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-border-strong/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-accent uppercase tracking-widest mb-2">
            <div className="size-2 rounded-full bg-accent animate-pulse" />
            Live Dashboard
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink">
            Welcome back, <em className="italic text-accent not-italic">{session?.user?.name?.split(" ")[0] || "there"}</em>.
          </h1>
          <p className="text-ink-muted text-base max-w-lg font-light leading-relaxed">
            Manage your content orchestration and delivery pipeline from a single editorial interface.
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild className="h-12 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg">
            <Link href="/dashboard/content-types/new">
              <Plus className="size-4 mr-2" />
              Create Content Type
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Content Types" 
          value={stats?.contentTypes ?? 0} 
          icon={Layers} 
          href="/dashboard/content-types" 
          isLoading={isLoading} 
        />
        <StatCard 
          label="Total Entries" 
          value={stats?.entries ?? 0} 
          icon={FileText} 
          href="/dashboard/content-types" 
          isLoading={isLoading} 
        />
        <StatCard 
          label="Media Assets" 
          value={stats?.mediaCount ?? 0} 
          icon={ImageIcon} 
          href="/dashboard/media" 
          isLoading={isLoading} 
        />
        <StatCard 
          label="API Requests" 
          value={stats?.apiRequests ?? 0} 
          icon={Activity} 
          href="/dashboard/usage" 
          isLoading={isLoading} 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Usage Panel */}
        <section className="lg:col-span-1">
          <Card className="h-full bg-paper border-border rounded-sm p-10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
            <CardHeader className="p-0 mb-10">
              <CardTitle className="font-display text-2xl font-semibold text-ink">
                Infrastructure Usage
              </CardTitle>
              <CardDescription className="font-light text-ink-muted text-sm leading-relaxed">
                Your current consumption metrics across the delivery network.
              </CardDescription>
            </CardHeader>
            <div className="space-y-10">
              <UsageBar label="Content Types" current={stats?.contentTypes ?? 0} max={10} />
              <UsageBar label="Media Storage" current={0.4} max={5} unit="GB" />
              <UsageBar label="API Bandwidth" current={12.5} max={100} unit="GB" />
              <div className="pt-8 mt-4 border-t border-border">
                <Link href="/dashboard/usage" className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent hover:opacity-80 transition-all no-underline flex items-center gap-2 group">
                  Detailed analytics <ArrowUpRight className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </Card>
        </section>

        {/* Quick Links / Guide */}
        <section className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4">
            <h3 className="font-display text-2xl font-semibold text-ink">
              Next Steps
            </h3>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 bg-canvas border border-border rounded-sm group cursor-pointer hover:border-accent hover:bg-paper transition-all duration-300">
              <div className="size-14 rounded-sm bg-paper border border-border flex items-center justify-center mb-8 group-hover:scale-105 group-hover:border-accent transition-all shadow-sm">
                <Layers className="size-6 text-accent" />
              </div>
              <h4 className="font-display text-xl font-semibold text-ink mb-4">Define your schema</h4>
              <p className="text-sm text-ink-muted leading-relaxed mb-8 font-light">
                Start by creating a Content Type. This defines the structured fields that editors will use.
              </p>
              <Link href="/dashboard/content-types/new" className="text-[11px] font-mono font-bold uppercase tracking-widest text-ink flex items-center gap-2 no-underline group-hover:text-accent transition-colors">
                Get Started <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="p-10 bg-canvas border border-border rounded-sm group cursor-pointer hover:border-accent hover:bg-paper transition-all duration-300">
              <div className="size-14 rounded-sm bg-paper border border-border flex items-center justify-center mb-8 group-hover:scale-105 group-hover:border-accent transition-all shadow-sm">
                <BookOpen className="size-6 text-accent" />
              </div>
              <h4 className="font-display text-xl font-semibold text-ink mb-4">API Documentation</h4>
              <p className="text-sm text-ink-muted leading-relaxed mb-8 font-light">
                Learn how to integrate FlowCMS into your application using our type-safe SDKs.
              </p>
              <a href={APP_CONFIG.docsUrl} target="_blank" className="text-[11px] font-mono font-bold uppercase tracking-widest text-ink flex items-center gap-2 no-underline group-hover:text-accent transition-colors">
                Read the Docs <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
