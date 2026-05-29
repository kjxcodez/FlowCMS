import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await req.json();
    const { collectionSlug, apiKeyId } = body;

    if (!collectionSlug) {
      return apiError("INVALID_INPUT", "Collection slug is required.");
    }

    // 1. Verify and load collection
    const collection = await prisma.collection.findFirst({
      where: {
        slug: collectionSlug,
        workspaceId: workspace.id,
      },
    });

    if (!collection) {
      return apiError("NOT_FOUND", `Collection "${collectionSlug}" not found in this workspace.`);
    }

    // 2. Verify and load API Key (if selected)
    let apiKeyName = "Session Auth (Dashboard)";
    if (apiKeyId) {
      const key = await prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          workspaceId: workspace.id,
        },
      });
      if (!key) {
        return apiError("NOT_FOUND", "Selected API Key not found in this workspace.");
      }
      apiKeyName = key.name;
    }

    // 3. Query entries of the collection (replicating the public REST API /api/v1/entries/[slug])
    const start = Date.now();
    
    const entries = await prisma.entry.findMany({
      where: {
        collectionId: collection.id,
        status: "PUBLISHED", // Public REST API strictly returns PUBLISHED entries only
      },
      orderBy: { updatedAt: "desc" },
    });

    const duration = Date.now() - start;

    // 4. Return results with rich parameters matching the public REST API headers
    return apiSuccess({
      entries,
      meta: {
        total: entries.length,
        page: 1,
        perPage: 20,
      },
      performance: {
        latencyMs: duration,
        statusCode: 200,
        apiKeyName,
        timestamp: new Date().toISOString(),
        headers: {
          "Content-Type": "application/json",
          "X-API-Version": "1",
          "X-Response-Time": `${duration}ms`,
          "X-Request-Id": crypto.randomUUID(),
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "Vary": "Accept-Encoding",
          "X-Cache-Tag": `ws:${workspace.id}`,
        },
      },
    });
  } catch (err) {
    console.error("API Explorer Proxy failure:", err);
    return apiError("INTERNAL_ERROR", "Unexpected API Explorer system execution failure.");
  }
}
