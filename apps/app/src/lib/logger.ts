import { captureCriticalError } from "./errors/capture-critical-error";

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

  // 2. Lightweight Critical Error Tracking
  if (level === "error") {
    const err = (context.error as Error) || new Error(message);
    const { route, method, operation, requestId, userId, workspaceId, ...meta } = context;
    captureCriticalError(err, {
      route: typeof route === "string" ? route : undefined,
      method: typeof method === "string" ? method : undefined,
      operation: typeof operation === "string" ? operation : undefined,
      requestId: typeof requestId === "string" ? requestId : undefined,
      userId: typeof userId === "string" ? userId : undefined,
      workspaceId: typeof workspaceId === "string" ? workspaceId : undefined,
      metadata: meta,
    }).catch((e) => {
      console.error("[logger] captureCriticalError failed:", e);
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
