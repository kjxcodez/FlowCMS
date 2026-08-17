"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncSubscription } from "./actions";
import { cn } from "@/lib/utils";

export function SyncButton({ subscriptionId }: { subscriptionId: string }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncSubscription(subscriptionId);
    } catch (err) {
      alert("Failed to sync: " + (err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isSyncing}
      onClick={handleSync}
      className={cn("text-ink-faint hover:text-accent transition-colors", isSyncing && "animate-spin text-accent")}
      title="Manual Sync from Razorpay"
    >
      <RefreshCcw className="size-3.5" />
    </Button>
  );
}
