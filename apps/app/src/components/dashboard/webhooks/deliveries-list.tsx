"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Code,
  CornerDownRight,
  RefreshCw,
  AlertTriangle,
  Play
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: unknown;
  statusCode: number | null;
  success: boolean;
  duration: number | null;
  retryCount: number;
  failureReason: string | null;
  responseBody: string | null;
  createdAt: Date | string;
}

interface DeliveriesListProps {
  initialDeliveries: WebhookDelivery[];
}

export function DeliveriesList({ initialDeliveries }: DeliveriesListProps) {
  const deliveries = initialDeliveries;
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, "payload" | "response">>({});

  const handleReplay = async (deliveryId: string) => {
    setReplayingId(deliveryId);
    try {
      const res = await fetch(`/api/internal/webhooks/deliveries/${deliveryId}/replay`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Webhook replayed successfully! It has been queued in QStash.");
      } else {
        toast.error(json.error?.message || "Failed to replay webhook.");
      }
    } catch (err) {
      toast.error("Network failure during manual webhook replay.");
      console.error(err);
    } finally {
      setReplayingId(null);
    }
  };

  const getTab = (id: string) => activeTabs[id] || "payload";
  const setTab = (id: string, tab: "payload" | "response") => {
    setActiveTabs(prev => ({ ...prev, [id]: tab }));
  };

  if (deliveries.length === 0) {
    return (
      <div className="p-16 bg-canvas border border-dashed border-border rounded-sm text-center ruled-bg">
        <AlertTriangle className="size-8 text-ink-faint mx-auto mb-4" />
        <p className="text-sm font-medium text-ink-muted">No delivery attempts recorded yet.</p>
        <p className="text-xs text-ink-faint mt-1">outbound event dispatches will appear here in real-time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deliveries.map((log) => {
        const isReplaying = replayingId === log.id;
        const currentTab = getTab(log.id);
        const hasResponse = !!log.responseBody;

        return (
          <Card key={log.id} className="bg-paper border-border hover:border-accent/40 transition-all duration-300 overflow-hidden relative">
            <CardContent className="p-0">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-canvas/40 border-b border-border">
                <div className="flex flex-wrap items-center gap-3">
                  {log.success ? (
                    <CheckCircle2 className="size-4 text-success shrink-0" />
                  ) : (
                    <XCircle className="size-4 text-destructive shrink-0" />
                  )}
                  <span className="font-mono text-xs font-bold text-ink tracking-tight">{log.event}</span>
                  
                  {/* Status Code badge */}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[9px] font-mono border-border uppercase font-semibold tracking-wider rounded-sm",
                      log.success ? "bg-success/5 text-success border-success/20" : "bg-destructive/5 text-destructive border-destructive/20"
                    )}
                  >
                    HTTP {log.statusCode || "N/A"}
                  </Badge>

                  {/* Latency badge */}
                  <Badge variant="outline" className="text-[9px] font-mono text-ink-muted border-border font-medium flex items-center gap-1">
                    <Clock className="size-2.5 text-ink-faint" />
                    {log.duration ? `${log.duration}ms` : "N/A"}
                  </Badge>

                  {/* Retry index badge */}
                  <Badge variant="outline" className="text-[9px] font-mono text-ink-muted border-border font-medium flex items-center gap-1">
                    <RefreshCw className="size-2.5 text-ink-faint" />
                    {log.retryCount > 0 ? `Retry #${log.retryCount}` : "Attempt 1"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-ink-faint">
                    {format(new Date(log.createdAt), "MMM dd, HH:mm:ss")}
                  </span>
                  
                  {/* Replay action button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isReplaying}
                    onClick={() => handleReplay(log.id)}
                    className="h-8 px-3 rounded-none hover:bg-canvas text-[9px] font-mono font-bold uppercase tracking-widest text-ink-muted hover:text-accent flex items-center gap-1.5 shrink-0"
                    title="Manually replay this event payload"
                  >
                    <Play className={cn("size-2.5 fill-current", isReplaying && "animate-spin")} />
                    {isReplaying ? "Replaying..." : "Replay"}
                  </Button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Error panel if failed */}
                {!log.success && log.failureReason && (
                  <div className="p-4 bg-destructive/5 border border-destructive/25 rounded-none flex items-start gap-3">
                    <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-destructive">Delivery Failure</p>
                      <p className="text-[11px] font-mono text-destructive/80 leading-relaxed">{log.failureReason}</p>
                    </div>
                  </div>
                )}

                {/* Code switcher tabs */}
                <div className="space-y-3">
                  <div className="flex border-b border-border gap-6">
                    <button
                      onClick={() => setTab(log.id, "payload")}
                      className={cn(
                        "pb-2 font-mono text-[9px] font-bold uppercase tracking-widest bg-transparent border-b-2 border-transparent text-ink-faint hover:text-ink cursor-pointer transition-all",
                        currentTab === "payload" && "border-accent text-ink"
                      )}
                    >
                      Payload JSON
                    </button>
                    <button
                      onClick={() => setTab(log.id, "response")}
                      className={cn(
                        "pb-2 font-mono text-[9px] font-bold uppercase tracking-widest bg-transparent border-b-2 border-transparent text-ink-faint hover:text-ink cursor-pointer transition-all",
                        currentTab === "response" && "border-accent text-ink"
                      )}
                    >
                      Response Body {hasResponse && <span className="size-1.5 inline-block rounded-full bg-accent-bright ml-1 align-middle" />}
                    </button>
                  </div>

                  {currentTab === "payload" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/30">
                        <Code className="size-3" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Outbound Payload JSON</span>
                      </div>
                      <pre className="bg-[#0F1109] p-4 text-[10px] font-mono text-white/70 overflow-auto max-h-48 custom-scrollbar border border-border select-all">
                        <code>{JSON.stringify(log.payload, null, 2)}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/30">
                        <CornerDownRight className="size-3" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Destination Response Preview</span>
                      </div>
                      {hasResponse ? (
                        <pre className="bg-[#0F1109] p-4 text-[10px] font-mono text-white/70 overflow-auto max-h-48 custom-scrollbar border border-border select-all">
                          <code>{log.responseBody}</code>
                        </pre>
                      ) : (
                        <div className="p-8 bg-[#0F1109] text-center text-[10px] font-mono text-white/20 border border-border">
                          No response body returned. (Either request failed, had no content, or timed out).
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
