import crypto from "crypto";
import { prisma } from "../prisma";

export interface CriticalErrorContext {
  route?: string;
  method?: string;
  operation?: string;
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  deploymentId?: string;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEY_PATTERN = /(password|token|secret|authorization|auth|cookie|key|credential|bearer|cvv|card)/i;

const THROTTLE_WINDOW_MS = 5000;
const recentFingerprints = new Map<string, { lastSaved: number; pendingCount: number }>();

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitizedObj[k] = sanitizeValue(k, v);
    }
    return sanitizedObj;
  }
  return value;
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    result[k] = sanitizeValue(k, v);
  }
  return result;
}

export function normalizeErrorMessage(msg: string): string {
  if (!msg) return "";
  return msg
    .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, "{uuid}")
    .replace(/\bc[a-z0-9]{24}\b/g, "{cuid}")
    .replace(/\b[0-9a-fA-F]{24,64}\b/g, "{hash}")
    .replace(/\b\d+\b/g, "{num}")
    .trim();
}

export function generateErrorFingerprint(
  errorName: string,
  normalizedMessage: string,
  route = "",
  operation = ""
): string {
  const payload = `${errorName.trim()}:${normalizedMessage.trim()}:${route.trim()}:${operation.trim()}`;
  return crypto.createHash("sha256").update(payload).digest("hex").substring(0, 32);
}

export async function captureCriticalError(
  error: unknown,
  context: CriticalErrorContext = {}
): Promise<void> {
  try {
    const errObj = error instanceof Error ? error : new Error(typeof error === "string" ? error : String(error));
    const errorName = errObj.name || "Error";
    const rawMessage = errObj.message || "Unknown error";
    const normalizedMessage = normalizeErrorMessage(rawMessage);
    const stackTrace = errObj.stack ? errObj.stack.substring(0, 4000) : null;
    const boundedMessage = rawMessage.substring(0, 2000);

    const route = context.route || null;
    const method = context.method || null;
    const operation = context.operation || null;
    const requestId = context.requestId || null;
    const userId = context.userId || null;
    const workspaceId = context.workspaceId || null;
    const deploymentId = context.deploymentId || process.env.VERCEL_DEPLOYMENT_ID || null;
    const environment = process.env.NODE_ENV || "development";

    const sanitizedMeta = sanitizeMetadata(context.metadata);

    const fingerprint = generateErrorFingerprint(errorName, normalizedMessage, route || "", operation || "");

    // 1. Structured log output for runtime environment (Vercel / Cloudwatch)
    console.error(
      JSON.stringify({
        level: "critical",
        event: "critical_error",
        fingerprint,
        errorName,
        message: boundedMessage,
        normalizedMessage,
        route,
        method,
        operation,
        requestId,
        environment,
        timestamp: new Date().toISOString(),
      })
    );

    // 2. In-Memory Burst Throttling Check
    const now = Date.now();
    const existing = recentFingerprints.get(fingerprint);
    if (existing && now - existing.lastSaved < THROTTLE_WINDOW_MS) {
      existing.pendingCount += 1;
      return;
    }

    const addedCount = existing ? existing.pendingCount + 1 : 1;
    recentFingerprints.set(fingerprint, { lastSaved: now, pendingCount: 0 });

    // Prune old entries from throttle cache to prevent memory leaks
    if (recentFingerprints.size > 1000) {
      for (const [fp, data] of recentFingerprints.entries()) {
        if (now - data.lastSaved > THROTTLE_WINDOW_MS * 2) {
          recentFingerprints.delete(fp);
        }
      }
    }

    // 3. Database Upsert Aggregation
    await prisma.criticalError.upsert({
      where: { fingerprint },
      update: {
        occurrenceCount: { increment: addedCount },
        lastSeenAt: new Date(),
      },
      create: {
        fingerprint,
        errorName,
        message: boundedMessage,
        route,
        method,
        environment,
        deploymentId,
        requestId,
        operation,
        userId,
        workspaceId,
        occurrenceCount: addedCount,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        status: "OPEN",
        stack: stackTrace,
        metadata: sanitizedMeta ? JSON.parse(JSON.stringify(sanitizedMeta)) : undefined,
      },
    });
  } catch (err) {
    // Fail-safe: error tracking failure must NEVER throw outward
    console.error("[captureCriticalError] Failure in tracking pipeline:", err);
  }
}
