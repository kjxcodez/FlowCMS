import { NextRequest } from "next/server";
import { verifyApiKey } from "@/lib/api-key";
import {
  checkRateLimit,
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
  scopes: string[];
  params: Promise<any>;
}

type ApiHandler = (
  req: NextRequest,
  ctx: ApiContext
) => Promise<Response>;

export function hasScope(keyScopes: string[], required: string | string[]): boolean {
  if (keyScopes.includes("admin:workspace")) {
    return true;
  }
  const requiredArray = Array.isArray(required) ? required : [required];
  return requiredArray.every((s) => keyScopes.includes(s));
}

export function requireScope(required: string | string[], handler: ApiHandler): ApiHandler {
  return async (req, ctx) => {
    if (!ctx.scopes) {
      return apiError("FORBIDDEN", "Insufficient scopes. API key has no scopes.");
    }
    if (!hasScope(ctx.scopes, required)) {
      return apiError("FORBIDDEN", "Insufficient scopes.");
    }
    return handler(req, ctx);
  };
}

export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest, context?: { params: Promise<any> }): Promise<Response> => {
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

    const { workspaceId, plan, apiKeyId, scopes } = keyData;

    // 3. Rate limit
    const rl = await checkRateLimit(`ws:${workspaceId}`, plan);
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
        scopes,
        params: context?.params || Promise.resolve({}),
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
    headers.set("X-API-Version", "1");
    
    // Cloudflare Cache Engineering
    // We EXCLUDE 'Authorization' from Vary to prevent cache fragmentation.
    // Security is enforced via Step 2-4 (Auth/Rate-limit) before this response is generated.
    headers.set("Vary", "Accept-Encoding"); 
    headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    headers.set("X-Cache-Tag", `ws:${workspaceId}`);

    Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) =>
      headers.set(k, v)
    );

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  };
}
