"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  FileText, 
  Layers, 
  Image as ImageIcon, 
  Key, 
  Globe, 
  User, 
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditLogItem } from "@/hooks/use-dashboard-analytics";

interface RecentActivityFeedProps {
  logs: AuditLogItem[] | undefined;
  isLoading: boolean;
}

export function RecentActivityFeed({ logs, isLoading }: RecentActivityFeedProps) {
  const getActionStyles = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
      case "GENERATE":
        return {
          dotColor: "bg-success",
          bgColor: "bg-success/10 border-success/20",
          iconColor: "text-success",
        };
      case "UPDATE":
      case "PUBLISH":
        return {
          dotColor: "bg-accent",
          bgColor: "bg-accent/10 border-accent/20",
          iconColor: "text-accent",
        };
      case "DELETE":
      case "REVOKE":
      case "UNPUBLISH":
        return {
          dotColor: "bg-destructive",
          bgColor: "bg-destructive/10 border-destructive/20",
          iconColor: "text-destructive",
        };
      default:
        return {
          dotColor: "bg-ink-faint",
          bgColor: "bg-canvas border-border",
          iconColor: "text-ink-muted",
        };
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case "collection":
        return Layers;
      case "entry":
        return FileText;
      case "media":
        return ImageIcon;
      case "apikey":
      case "api-key":
        return Key;
      case "webhook":
        return Globe;
      default:
        return Sparkles;
    }
  };

  const getFriendlyActionText = (action: string, type: string, name: string | null) => {
    const rName = name ? `"${name}"` : "resource";
    
    switch (action.toUpperCase()) {
      case "CREATE":
        return `Created new ${type} ${rName}`;
      case "UPDATE":
        return `Updated ${type} ${rName}`;
      case "DELETE":
        return `Deleted ${type} ${rName}`;
      case "PUBLISH":
        return `Published entry ${rName}`;
      case "UNPUBLISH":
        return `Unpublished entry ${rName}`;
      case "GENERATE":
        return `Generated API Key ${rName}`;
      case "REVOKE":
        return `Revoked API Key ${rName}`;
      default:
        return `${action}d ${type} ${rName}`;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-paper border-border rounded-sm p-8 shadow-sm">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-6 pt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const hasLogs = logs && logs.length > 0;

  return (
    <Card className="min-h-[450px] bg-paper border-border rounded-sm p-8 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
      
      <CardHeader className="p-0 mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="font-display text-2xl font-semibold text-ink">
              Recent Workspace Activity
            </CardTitle>
            <CardDescription className="text-xs text-ink-muted leading-relaxed font-light mt-1.5">
              Live audit stream of all collaborative pipeline adjustments.
            </CardDescription>
          </div>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="size-2 rounded-full bg-success/20 animate-pulse" />
            <span className="size-2 rounded-full bg-success/60" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-success">
              Live
            </span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-hidden">
        {!hasLogs ? (
          <div className="py-12 text-center space-y-4 border border-dashed border-border rounded-sm bg-canvas/30">
            <Sparkles className="size-8 text-ink-faint mx-auto animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">No activity logged yet</p>
              <p className="text-xs text-ink-muted font-light max-w-[240px] mx-auto leading-relaxed">
                Perform content alterations or query endpoints to populate your feed.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="relative pl-6 border-l border-border space-y-6">
                {logs.map((log) => {
                  const styles = getActionStyles(log.action);
                  const Icon = getResourceIcon(log.resourceType);
                  const actionText = getFriendlyActionText(log.action, log.resourceType, log.resourceName);
                  
                  let timeStr = "recently";
                  try {
                    timeStr = formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });
                  } catch {
                    // Fallback if date is invalid
                  }

                  return (
                    <div key={log.id} className="relative group/item">
                      {/* Activity Dot */}
                      <div className={`absolute -left-[30px] top-1.5 size-4 rounded-full border-4 border-paper flex items-center justify-center shrink-0`}>
                        <div className={`size-1.5 rounded-full ${styles.dotColor}`} />
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`size-8 rounded-sm ${styles.bgColor} border flex items-center justify-center shrink-0`}>
                            <Icon className={`size-4 ${styles.iconColor}`} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-ink leading-snug group-hover/item:text-accent transition-colors">
                              {actionText}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-ink-muted font-light">
                              <span className="flex items-center gap-1">
                                <User className="size-3 text-ink-faint" />
                                {log.user?.name || log.user?.email || "System"}
                              </span>
                              <span>•</span>
                              <span>{timeStr}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <a 
                href="/dashboard/audit-logs" 
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent hover:opacity-80 transition-all no-underline flex items-center gap-2 group w-fit"
              >
                Access complete security audits 
                <ArrowUpRight className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
