"use client";

import React, { useState } from "react";
import { RefreshCw, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { syncAllSubscriptions } from "@/app/(admin)/admin/operations/actions";
import { toast } from "sonner";

export function OperationsTools() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const promise = syncAllSubscriptions();
    
    toast.promise(promise, {
      loading: "Synchronizing billing states with Razorpay...",
      success: (data) => `Sync complete: ${data.updated} updated, ${data.failed} failed.`,
      error: "Failed to initiate billing synchronization.",
    });

    try {
      await promise;
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="bg-sidebar border-white/5 shadow-2xl overflow-hidden">
      <CardHeader className="bg-white/[0.02] border-b border-white/5">
        <CardTitle className="text-xl font-display font-semibold text-white flex items-center gap-3">
          <CreditCard className="size-5 text-accent-bright" />
          Billing & Recovery
        </CardTitle>
        <p className="text-xs text-white/40 mt-1">Manual synchronization tools for system integrity.</p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-sm">
          <AlertCircle className="size-4 text-amber-500 mt-0.5" />
          <p className="text-[10px] text-amber-500/80 font-medium leading-relaxed uppercase tracking-wider">
            Use "Sync Subscriptions" only if webhooks are delayed or a workspace is reporting an incorrect plan status after payment.
          </p>
        </div>

        <Button 
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent-bright/50 text-white font-mono text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all flex items-center justify-center gap-3"
        >
          <RefreshCw className={isSyncing ? "size-3.5 animate-spin" : "size-3.5"} />
          {isSyncing ? "Synchronizing..." : "Sync All Subscriptions"}
        </Button>

        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
            <span className="text-white/40">Last Full Sync</span>
            <span className="text-white/60">Never</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
            <span className="text-white/40">Webhook Health</span>
            <span className="text-success flex items-center gap-1.5 font-bold">
               <CheckCircle2 className="size-2.5" />
               Operational
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
