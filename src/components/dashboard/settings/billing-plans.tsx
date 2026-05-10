"use client";

import { useState } from "react";
import { APP_CONFIG } from "@/config/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BillingPlansProps {
  currentPlan: string;
}

export function BillingPlans({ currentPlan }: BillingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    if (planKey === "HOBBY" || currentPlan === planKey.split("_")[0]) return;

    setLoading(planKey);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to start checkout");

      const { subscriptionId, keyId, userEmail, userName } = result.data;

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "FlowCMS",
        description: `Subscription to ${planKey.replace("_MONTHLY", "")} Plan`,
        image: "/logo.png",
        handler: function () {
          toast.success("Payment successful! Your workspace will be upgraded shortly.");
          setTimeout(() => window.location.reload(), 2000);
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#4E7C59", // Sap Green
        },
      };

      const rzp = new (window as any).Razorpay(options); // eslint-disable-line @typescript-eslint/no-explicit-any
      rzp.on('payment.failed', function (response: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        toast.error("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-3 pt-4">
      {APP_CONFIG.pricing.map((p) => {
        const isCurrent = currentPlan === p.planKey.split("_")[0];
        const isHobby = p.planKey === "HOBBY";

        return (
          <Card 
            key={p.plan} 
            className={cn(
              "relative flex flex-col border-2 transition-all duration-300 rounded-none overflow-hidden", // Sharp edges
              p.featured ? "border-accent bg-accent/5 shadow-lg scale-105 z-10" : "border-border",
              isCurrent && "border-accent ring-1 ring-accent/20"
            )}
          >
            {p.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white animate-pulse-custom z-20">
                Most Popular
              </div>
            )}
            <CardHeader className="pb-8 relative z-10">
              <CardTitle className="font-display text-3xl tracking-tight">{p.plan}</CardTitle>
              <CardDescription className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-foreground tabular-nums">{p.price}</span>
                <span className="text-sm font-medium text-muted-foreground">{p.period}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-8 relative z-10">
              <ul className="space-y-4 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center bg-accent-bright text-ink">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-ink/80 leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-0 relative z-10">
              <Button 
                className={cn(
                  "w-full font-bold uppercase tracking-widest py-6 rounded-none transition-all duration-200", // Sharp edges
                  isCurrent ? "bg-border text-muted-foreground cursor-default hover:bg-border" : "hover:scale-[1.02]"
                )}
                variant={p.featured ? "default" : "outline"}
                disabled={loading !== null || isCurrent || (isHobby && isCurrent)}
                onClick={() => handleSubscribe(p.planKey)}
              >
                {loading === p.planKey ? "Processing..." : isCurrent ? "Current Plan" : p.cta}
              </Button>
            </CardFooter>
            
            {/* Texture overlay for industrial look */}
            <div className="absolute inset-0 pointer-events-none noise-overlay opacity-30" />
            {p.featured && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-bright/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
            )}
          </Card>
        );
      })}
    </div>
  );
}
