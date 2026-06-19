import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BillingPlans } from "@/components/dashboard/settings/billing-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getPlanConfig } from "@/lib/plans";

function getPlanLimit(plan: string): number | null {
  const limit = getPlanConfig(plan).apiRequestsPerMonth;
  return limit === -1 ? null : limit;
}

const statusConfig = {
  active: { color: "bg-success", text: "Active" },
  created: { color: "bg-orange-400", text: "Pending" },
  authenticated: { color: "bg-orange-400", text: "Pending" },
  paused: { color: "bg-orange-400", text: "Paused" },
  cancelled: { color: "bg-destructive", text: "Cancelled" },
  expired: { color: "bg-destructive", text: "Expired" },
  halted: { color: "bg-destructive", text: "Payment Failed" },
};

export default async function BillingPage() {
  const { workspace } = await requireWorkspace();

  const subscription = await prisma.razorpayCustomer.findUnique({
    where: { workspaceId: workspace.id },
  });

  const now = new Date();
  const monthlyUsage = await prisma.monthlyUsage.findUnique({
    where: {
      workspaceId_year_month: {
        workspaceId: workspace.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }
    }
  });

  const apiRequests = monthlyUsage?.apiRequests ?? 0;
  const planLimit = getPlanLimit(workspace.plan);
  const usagePercent = planLimit 
    ? Math.min((apiRequests / planLimit) * 100, 100) 
    : 0; // unlimited
  const barWidth = `${usagePercent.toFixed(1)}%`;
  const barColor = usagePercent > 95 
    ? "bg-destructive" 
    : usagePercent > 80 
      ? "bg-orange-400" 
      : "bg-accent-bright";
  const limitDisplay = planLimit 
    ? planLimit.toLocaleString() 
    : "Unlimited";

  const status = subscription?.subscriptionStatus ?? "active";
  const config = statusConfig[status as keyof typeof statusConfig] 
    ?? statusConfig.active;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground text-lg">Manage your workspace subscription and billing history.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="rounded-none border-2 border-border ruled-bg relative overflow-hidden group hover:border-accent-bright/50 transition-colors duration-300">
          <CardHeader>
            <CardTitle className="font-display text-2xl tracking-tight">Current Subscription</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Details about your current plan tier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Plan</span>
              <Badge variant="secondary" className="rounded-none uppercase font-bold tracking-widest bg-accent-bright text-ink border-accent-bright px-3 py-1 scale-110">
                {workspace.plan}
              </Badge>
            </div>
            {subscription?.currentPeriodEnd && (
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Renewal Date</span>
                <span className="text-sm font-mono tabular-nums font-bold">
                  {format(new Date(subscription.currentPeriodEnd), "MMMM dd, yyyy")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Subscription Status</span>
              <span className={cn("text-sm capitalize font-bold flex items-center gap-2", config.color.replace("bg-", "text-"))}>
                <div className={cn("h-2 w-2 rounded-full animate-pulse", config.color)} />
                {config.text}
              </span>
            </div>
          </CardContent>
          <div className="absolute inset-0 pointer-events-none noise-overlay opacity-20" />
        </Card>

        <Card className="rounded-none border-2 border-border bg-sidebar text-sidebar-foreground relative overflow-hidden group hover:border-accent-bright/30 transition-colors duration-300">
          <CardHeader>
            <CardTitle className="font-display text-2xl tracking-tight text-white">Usage Overview</CardTitle>
            <CardDescription className="text-sidebar-foreground/60 font-medium">Your API request volume for this period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
             <div className="space-y-4">
               <div className="flex justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-sidebar-foreground/50">
                 <span>API Requests Consumption</span>
                 <span>Limit: {limitDisplay}</span>
               </div>
               <div className="h-3 bg-sidebar-border relative overflow-hidden">
                 <div 
                   className={cn("absolute inset-y-0 left-0 transition-all duration-1000 ease-in-out", barColor)} 
                   style={{ width: barWidth }} 
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent to-sidebar/20 pointer-events-none" />
               </div>
               <div className="flex justify-between items-baseline">
                 <div className="text-xl text-accent-bright font-display font-bold tabular-nums italic">{apiRequests.toLocaleString()} <span className="text-xs font-sans not-italic text-sidebar-foreground/60">requests</span></div>
                 <div className="text-[10px] text-sidebar-foreground/40 font-mono uppercase">{usagePercent.toFixed(1)}% utilized</div>
               </div>
             </div>
          </CardContent>
          <div className="absolute inset-0 pointer-events-none noise-overlay opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-bright/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        </Card>
      </div>

      {subscription?.cancelAtPeriodEnd && (
        <div className="border border-orange-400/30 bg-orange-400/5 rounded-none px-6 py-4 flex items-center gap-4 animate-in slide-in-from-top-2 duration-500">
          <span className="text-orange-400 text-sm font-medium">
            Your subscription is cancelled and will end on{" "}
            {subscription.currentPeriodEnd 
              ? format(new Date(subscription.currentPeriodEnd), "MMMM dd, yyyy")
              : "the current period end"}.
            You will be downgraded to Hobby after this date.
          </span>
        </div>
      )}

      <div className="space-y-10 pt-16">
        <div className="flex flex-col gap-2 border-l-4 border-accent-bright pl-6">
          <h2 className="text-3xl font-display font-bold tracking-tight">Available Plans</h2>
          <p className="text-muted-foreground">Select a plan that fits your growth and performance needs.</p>
        </div>
        <BillingPlans currentPlan={workspace.plan} />
      </div>

      <Card className="rounded-none border-2 border-border bg-muted/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <h3 className="font-display text-xl font-bold italic">Need more scale?</h3>
          <p className="text-muted-foreground text-sm">Custom limits, dedicated support, and enterprise features.</p>
        </div>
        <Badge asChild variant="outline" className="rounded-none border-border px-6 py-2 uppercase font-bold tracking-widest hover:bg-background transition-colors relative z-10 cursor-pointer">
          <a href="mailto:sales@getflowcms.com">
            Contact Sales
          </a>
        </Badge>
        <div className="absolute inset-0 pointer-events-none noise-overlay opacity-20" />
      </Card>
    </div>
  );
}
