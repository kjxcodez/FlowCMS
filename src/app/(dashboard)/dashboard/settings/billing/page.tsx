import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BillingPlans } from "@/components/dashboard/settings/billing-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function BillingPage() {
  const { workspace } = await requireWorkspace();

  const subscription = await prisma.razorpayCustomer.findUnique({
    where: { workspaceId: workspace.id },
  });

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
              <span className="text-sm capitalize font-bold text-success flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                {subscription?.subscriptionStatus || "Active"}
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
                 <span>Limit: 250,000</span>
               </div>
               <div className="h-3 bg-sidebar-border relative overflow-hidden">
                 <div 
                   className="absolute inset-y-0 left-0 bg-accent-bright transition-all duration-1000 ease-in-out" 
                   style={{ width: '15%' }} 
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent to-sidebar/20 pointer-events-none" />
               </div>
               <div className="flex justify-between items-baseline">
                 <div className="text-xl text-accent-bright font-display font-bold tabular-nums italic">37,450 <span className="text-xs font-sans not-italic text-sidebar-foreground/60">requests</span></div>
                 <div className="text-[10px] text-sidebar-foreground/40 font-mono uppercase">15.2% utilized</div>
               </div>
             </div>
          </CardContent>
          <div className="absolute inset-0 pointer-events-none noise-overlay opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-bright/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        </Card>
      </div>

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
        <Badge variant="outline" className="rounded-none border-border px-6 py-2 uppercase font-bold tracking-widest hover:bg-background transition-colors relative z-10 cursor-pointer">
          Contact Sales
        </Badge>
        <div className="absolute inset-0 pointer-events-none noise-overlay opacity-20" />
      </Card>
    </div>
  );
}
