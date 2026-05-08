import { NextRequest } from "next/server";
import { verifyApiKey } from "@/lib/api-key";
import {
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { apiError } from "@/types/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export interface ApiContext {
  workspaceId: string;
  plan: string;
  apiKeyId: string;
  requestId: string;
}

type ApiHandler = (
  req: NextRequest,
  ctx: ApiContext
) => Promise<Response>;

export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const start = Date.now();

    // 1. Extract API key
    const authHeader = req.headers.get("Authorization");
    const rawKey = authHeader?.replace("Bearer ", "").trim();
    if (!rawKey) {
      return apiError(
        "UNAUTHORIZED",
        "Missing Authorization header. Use: Bearer flw_..."
      );
    }

    // 2. Verify key
    const keyData = await verifyApiKey(rawKey);
    if (!keyData) {
      return apiError("UNAUTHORIZED", "Invalid API key.");
    }

    const { workspaceId, plan, apiKeyId } = keyData;

    // 3. Rate limit
    const rlConfig =
      RATE_LIMIT_CONFIGS[plan] ?? RATE_LIMIT_CONFIGS.HOBBY;
    const rl = checkRateLimit(`ws:${workspaceId}`, rlConfig);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded.",
          code: "RATE_LIMITED",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitHeaders(rl),
          },
        }
      );
    }

    // 4. Monthly usage check
    const usage = await checkUsageLimit(workspaceId, plan);
    if (!usage.allowed) {
      return apiError(
        "PLAN_LIMIT_REACHED",
        `Monthly limit reached (${usage.limit.toLocaleString()} requests).`
      );
    }

    // 5. Run handler
    let response: Response;
    try {
      response = await handler(req, {
        workspaceId,
        plan,
        apiKeyId,
        requestId,
      });
    } catch (err) {
      logger.error("API handler error", {
        requestId,
        error: String(err),
      });
      response = apiError("INTERNAL_ERROR", "Unexpected error.");
    }

    // 6. Track usage (fire and forget)
    const duration = Date.now() - start;
    Promise.all([
      incrementUsage(workspaceId),
      prisma.usageLog.create({
        data: {
          workspaceId,
          apiKeyId,
          endpoint: `${req.method} ${new URL(req.url).pathname}`,
          method: req.method,
          statusCode: response.status,
          duration,
          ip: req.headers.get("x-forwarded-for"),
          userAgent: req.headers.get("user-agent"),
        },
      }),
    ]).catch((err) => {
      logger.error("Usage tracking error", {
        requestId,
        error: String(err),
      });
    });

    // 7. Add headers
    const headers = new Headers(response.headers);
    headers.set("X-Request-Id", requestId);
    headers.set("X-Response-Time", `${duration}ms`);
    Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) =>
      headers.set(k, v)
    );

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  };
}
