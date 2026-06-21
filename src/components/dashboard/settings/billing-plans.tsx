"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function BillingPlans(_props: { currentPlan: string }) {
  return (
    <div className="pt-4 max-w-2xl mx-auto">
      <Card className="bg-[#0F110A] border-accent/20 border-l-4 border-l-accent overflow-hidden shadow-2xl p-10 group relative">
        <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        
        <CardContent className="p-0 flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="size-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Sparkles className="size-8 text-accent animate-pulse" />
          </div>
          
          <div className="space-y-3">
            <h3 className="font-display text-2xl font-semibold text-white tracking-tight leading-tight">
              Early Access Beta Active
            </h3>
            <p className="text-white/60 text-sm max-w-md font-light leading-relaxed">
              Your workspace is automatically allocated premium Hobby resources completely free of charge. Pricing plans and billing mechanisms are currently disabled during the early access test phase.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] uppercase font-bold tracking-widest">
            Currently in Early Access Beta. Billing coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
