"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Sparkles } from "lucide-react";

interface PublishingStatusChartProps {
  published: number | undefined;
  draft: number | undefined;
  isLoading: boolean;
}

export function PublishingStatusChart({ published = 0, draft = 0, isLoading }: PublishingStatusChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-paper border-border rounded-sm p-8 shadow-sm">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-[220px] w-full pt-4" />
        </div>
      </Card>
    );
  }

  const data = [
    { name: "Published", value: published, color: "#CBE54C" },
    { name: "Draft", value: draft, color: "#a3a3a3" },
  ];

  const total = published + draft;
  const hasData = total > 0;

  return (
    <Card className="bg-paper border-border rounded-sm p-8 shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-2 text-accent">
          <Layers className="size-4" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
            Lifecycle Metrics
          </span>
        </div>
        <CardTitle className="font-display text-xl font-semibold text-ink mt-2">
          Publishing Status
        </CardTitle>
        <CardDescription className="text-xs text-ink-muted leading-relaxed font-light mt-1">
          Ratio of live, public edge CDN documents versus internal active drafts.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col justify-center min-h-[220px]">
        {!hasData ? (
          <div className="py-12 text-center space-y-4 border border-dashed border-border rounded-sm bg-canvas/30 my-auto">
            <Sparkles className="size-8 text-ink-faint mx-auto animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">No entries found</p>
              <p className="text-xs text-ink-muted font-light max-w-[240px] mx-auto leading-relaxed">
                Create structured schemas and publish document drafts to render delivery ratios.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-[220px] relative text-[10px] font-mono">
            {/* Center percentage indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="font-display text-2xl font-bold text-white">
                {total > 0 ? Math.round((published / total) * 100) : 0}%
              </span>
              <span className="text-[9px] font-mono uppercase text-ink-muted tracking-widest mt-0.5">
                Live CDN
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#1A1C16" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F110A",
                    borderColor: "#262626",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "#fff",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
