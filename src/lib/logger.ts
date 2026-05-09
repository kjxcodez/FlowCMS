import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function log(
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {}
) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // 1. Console Logging
  if (process.env.NODE_ENV === "production") {
    const method = level === "debug" ? "log" : level;
    console[method](JSON.stringify(entry));
  } else {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    const ctx = Object.keys(context).length
      ? " " + JSON.stringify(context)
      : "";
    const method = level === "debug" ? "log" : level;
    console[method](`${prefix} ${message}${ctx}`);
  }

  // 2. Sentry Integration
  if (level === "error") {
    Sentry.captureException(context.error || new Error(message), {
      extra: context,
      tags: { 
        workspaceId: context.workspaceId as string,
        subscriptionId: context.subscriptionId as string
      }
    });
  } else if (level === "warn") {
    Sentry.captureMessage(message, {
      level: "warning",
      extra: context,
    });
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) =>
    log("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) =>
    log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) =>
    log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) =>
    log("error", msg, ctx),
};
