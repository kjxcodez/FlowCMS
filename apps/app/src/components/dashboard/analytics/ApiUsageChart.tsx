"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Sparkles } from "lucide-react";
import { AnalyticsChartItem } from "@/hooks/use-dashboard-analytics";

interface ApiUsageChartProps {
  data: AnalyticsChartItem[] | undefined;
  isLoading: boolean;
}

export function ApiUsageChart({ data, isLoading }: ApiUsageChartProps) {
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

  // Check if there are actually any request logs to show
  const hasRequests = data && data.some((d) => d.apiRequests > 0);

  return (
    <Card className="bg-paper border-border rounded-sm p-8 shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-2 text-accent">
          <Activity className="size-4" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
            Traffic Operations
          </span>
        </div>
        <CardTitle className="font-display text-xl font-semibold text-ink mt-2">
          API Requests & Logs
        </CardTitle>
        <CardDescription className="text-xs text-ink-muted leading-relaxed font-light mt-1">
          Historical requests and delivery status codes across CDN nodes.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col justify-center min-h-[220px]">
        {!hasRequests ? (
          <div className="py-12 text-center space-y-4 border border-dashed border-border rounded-sm bg-canvas/30 my-auto">
            <Sparkles className="size-8 text-ink-faint mx-auto animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">No API requests recorded yet</p>
              <p className="text-xs text-ink-muted font-light max-w-[240px] mx-auto leading-relaxed">
                Your pre-provisioned endpoints are waiting. Hit the CDN using the sandbox cURL commands to log request traffic here.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-[220px] text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
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
                  cursor={{ stroke: "#CBE54C", strokeWidth: 1, strokeDasharray: "2 2" }}
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
                <Line
                  type="monotone"
                  dataKey="apiSuccess"
                  name="Success (2xx/3xx)"
                  stroke="#CBE54C"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: "#CBE54C" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="apiError"
                  name="Error (4xx/5xx)"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: "#EF4444" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
