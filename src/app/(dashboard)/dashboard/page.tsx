"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Activity, 
  ArrowUpRight,
  Plus,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useDashboardAnalytics } from "@/hooks/use-dashboard-analytics";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLAN_LIMITS } from "@/types/cms";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeCard } from "@/components/dashboard/onboarding/WelcomeCard";
import { OnboardingChecklist } from "@/components/dashboard/onboarding/OnboardingChecklist";
import { FirstApiCallWidget } from "@/components/dashboard/onboarding/FirstApiCallWidget";
import { DeveloperQuickActions } from "@/components/dashboard/onboarding/DeveloperQuickActions";
import { RecentActivityFeed } from "@/components/dashboard/onboarding/RecentActivityFeed";
import { ApiUsageChart } from "@/components/dashboard/analytics/ApiUsageChart";
import { PublishingStatusChart } from "@/components/dashboard/analytics/PublishingStatusChart";
import { WorkspaceGrowthChart } from "@/components/dashboard/analytics/WorkspaceGrowthChart";
import { AnimatePresence } from "motion/react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href: string;
  isLoading?: boolean;
}

const StatCard = ({ label, value, icon: Icon, href, isLoading }: StatCardProps) => (
  <Link href={href} className="group no-underline block">
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
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : Math.min(Math.round((current / max) * 100), 100);
  const displayMax = isUnlimited ? "∞" : max.toLocaleString();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          {label}
        </span>
        <span className="text-[12px] font-semibold text-ink font-mono">
          {current.toLocaleString()} <span className="text-ink-muted font-light">/</span> {displayMax} {unit}
        </span>
      </div>
      <Progress value={percentage} className="h-1 bg-canvas" />
    </div>
  );
};

export default function DashboardOverview() {
  const { data: session } = useSession();
  const { data: workspace } = useWorkspace();
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useDashboardStats();
  const [range, setRange] = useState("7d");
  const { data: analytics, isLoading: isAnalyticsLoading, refetch: refetchAnalytics } = useDashboardAnalytics(range);

  // Dynamic boundaries resolver
  const activePlan = workspace?.plan || "HOBBY";
  const limits = PLAN_LIMITS[activePlan];
  const storageLimitGb = activePlan === "PRO" ? 50 : activePlan === "AGENCY" ? 250 : activePlan === "ENTERPRISE" ? -1 : 5;

  // Avoid hydration issues by tracking mounted state
  const [mounted, setMounted] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(true);
  const [checklistDismissed, setChecklistDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setWelcomeDismissed(localStorage.getItem("flowcms_welcome_dismissed") === "true");
      setChecklistDismissed(localStorage.getItem("flowcms_checklist_dismissed") === "true");
    }
  }, []);

  const handleDismissWelcome = () => {
    localStorage.setItem("flowcms_welcome_dismissed", "true");
    setWelcomeDismissed(true);
  };

  const handleDismissChecklist = () => {
    localStorage.setItem("flowcms_checklist_dismissed", "true");
    setChecklistDismissed(true);
  };

  // Allow resetting onboarding elements for developers to test
  const handleResetOnboarding = () => {
    localStorage.setItem("flowcms_welcome_dismissed", "false");
    localStorage.setItem("flowcms_checklist_dismissed", "false");
    setWelcomeDismissed(false);
    setChecklistDismissed(false);
  };

  const checklistStats = {
    collections: stats?.collections ?? 0,
    entries: stats?.entries ?? 0,
    mediaCount: stats?.mediaCount ?? 0,
    apiRequests: stats?.apiRequests ?? 0,
    publishedCount: analytics?.counts?.published ?? 0,
  };

  const isSyncing = isStatsLoading || isAnalyticsLoading;

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out pb-12">
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
          {mounted && (welcomeDismissed && checklistDismissed) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOnboarding}
              className="h-12 border-border hover:border-accent text-ink-muted hover:text-accent text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm"
            >
              Reset Guides
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              refetchStats();
              refetchAnalytics();
            }}
            disabled={isSyncing}
            className="size-12 rounded-sm border-border hover:border-accent hover:text-accent shrink-0"
            title="Refresh metrics"
          >
            <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
          </Button>

          <Button asChild className="h-12 px-8 text-[11px] font-bold uppercase tracking-widest rounded-sm shadow-lg">
            <Link href="/dashboard/collections/new">
              <Plus className="size-4 mr-2" />
              Create Collection
            </Link>
          </Button>
        </div>
      </header>

      {/* Welcome Card banner */}
      {mounted && !welcomeDismissed && (
        <AnimatePresence>
          <WelcomeCard onDismiss={handleDismissWelcome} />
        </AnimatePresence>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Collections" 
          value={stats?.collections ?? 0} 
          icon={Layers} 
          href="/dashboard/collections" 
          isLoading={isStatsLoading} 
        />
        <StatCard 
          label="Total Entries" 
          value={stats?.entries ?? 0} 
          icon={FileText} 
          href="/dashboard/collections" 
          isLoading={isStatsLoading} 
        />
        <StatCard 
          label="Media Assets" 
          value={stats?.mediaCount ?? 0} 
          icon={ImageIcon} 
          href="/dashboard/media" 
          isLoading={isStatsLoading} 
        />
        <StatCard 
          label="API Requests" 
          value={stats?.apiRequests ?? 0} 
          icon={Activity} 
          href="/dashboard/usage" 
          isLoading={isStatsLoading} 
        />
      </section>

      {/* Two Column Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area: Left 2 Columns */}
        <div className="lg:col-span-2 space-y-12">
          {/* Getting Started Checklist */}
          {mounted && !checklistDismissed && (
            <AnimatePresence>
              <OnboardingChecklist stats={checklistStats} onDismiss={handleDismissChecklist} />
            </AnimatePresence>
          )}

          {/* Quick Actions Grid */}
          <DeveloperQuickActions />

          {/* Code Sandbox Explorer */}
          <FirstApiCallWidget />
        </div>

        {/* Sidebar Area: Right 1 Column */}
        <div className="space-y-12">
          {/* Recent Activity stream */}
          <RecentActivityFeed logs={analytics?.auditLogs} isLoading={isAnalyticsLoading} />

          {/* Infrastructure Usage */}
          <section>
            <Card className="bg-paper border-border rounded-sm p-8 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
              <CardHeader className="p-0 mb-8">
                <CardTitle className="font-display text-xl font-semibold text-ink">
                  Infrastructure Usage
                </CardTitle>
                <CardDescription className="font-light text-ink-muted text-xs leading-relaxed mt-1">
                  Your active package allocation ceilings on the {activePlan.toLowerCase()} tier.
                </CardDescription>
              </CardHeader>
              <div className="space-y-8">
                <UsageBar 
                  label="Collections Limit" 
                  current={stats?.collections ?? 0} 
                  max={limits?.collections ?? 3} 
                />
                <UsageBar 
                  label="Media Storage Allocation" 
                  current={Number(((stats?.storageBytes ?? 0) / (1024 * 1024 * 1024)).toFixed(2))} 
                  max={storageLimitGb} 
                  unit="GB" 
                />
                <UsageBar 
                  label="API Request Bandwidth" 
                  current={stats?.apiRequests ?? 0} 
                  max={limits?.apiRequestsPerMonth ?? 5000} 
                />
                <div className="pt-6 border-t border-border">
                  <Link href="/dashboard/usage" className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent hover:opacity-80 transition-all no-underline flex items-center gap-2 group w-fit">
                    Detailed statistics <ArrowUpRight className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <section className="space-y-8 pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-accent">
              <TrendingUp className="size-4" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
                Live Analytics Pipeline
              </span>
            </div>
            <h2 className="font-display text-3xl font-semibold text-ink">
              Visual Intelligence
            </h2>
            <p className="text-xs text-ink-muted font-light leading-relaxed">
              Verify database requests, content creation velocities, and growth trends.
            </p>
          </div>

          {/* Time range selector */}
          <div className="flex bg-paper border border-border rounded-sm p-0.5 self-start sm:self-center">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest rounded-sm border-none cursor-pointer transition-all ${
                  range === r
                    ? "bg-accent text-sidebar font-black shadow-md"
                    : "text-ink-muted hover:text-ink bg-transparent"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Charts responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ApiUsageChart data={analytics?.chartData} isLoading={isAnalyticsLoading} />
          </div>
          <div>
            <PublishingStatusChart 
              published={analytics?.counts?.published} 
              draft={analytics?.counts?.draft} 
              isLoading={isAnalyticsLoading} 
            />
          </div>
          <div className="lg:col-span-3">
            <WorkspaceGrowthChart data={analytics?.growthData} isLoading={isAnalyticsLoading} />
          </div>
        </div>
      </section>
    </div>
  );
}
