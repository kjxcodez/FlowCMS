"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Sparkles } from "lucide-react";
import { GrowthChartItem } from "@/hooks/use-dashboard-analytics";

interface WorkspaceGrowthChartProps {
  data: GrowthChartItem[] | undefined;
  isLoading: boolean;
}

export function WorkspaceGrowthChart({ data, isLoading }: WorkspaceGrowthChartProps) {
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

  // Check if there are items in the database (collections > 0)
  const hasGrowth = data && data.length > 0 && data[data.length - 1] && (
    data[data.length - 1].Collections > 0 ||
    data[data.length - 1].Entries > 0 ||
    data[data.length - 1].Media > 0
  );

  return (
    <Card className="bg-paper border-border rounded-sm p-8 shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-2 text-accent">
          <TrendingUp className="size-4" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
            Workspace Analytics
          </span>
        </div>
        <CardTitle className="font-display text-xl font-semibold text-ink mt-2">
          Content & Asset Accumulation
        </CardTitle>
        <CardDescription className="text-xs text-ink-muted leading-relaxed font-light mt-1">
          Cumulative growth profiles for collections, content entries, and media files.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col justify-center min-h-[220px]">
        {!hasGrowth ? (
          <div className="py-12 text-center space-y-4 border border-dashed border-border rounded-sm bg-canvas/30 my-auto">
            <Sparkles className="size-8 text-ink-faint mx-auto animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">No metrics generated</p>
              <p className="text-xs text-ink-muted font-light max-w-[240px] mx-auto leading-relaxed">
                Add models, documents, and media to build a history of workspace usage over time.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-[220px] text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.3} />
                <XAxis
                  dataKey="day"
                  stroke="#737373"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#737373"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
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
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                />
                <Bar
                  dataKey="Collections"
                  name="Schemas"
                  fill="#CBE54C"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="Entries"
                  name="Entries"
                  fill="#C084FC"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="Media"
                  name="Assets"
                  fill="#60A5FA"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
