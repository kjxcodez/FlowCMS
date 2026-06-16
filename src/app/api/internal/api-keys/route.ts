import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { ApiKeyService } from "@/server/services/api-key.service";
import { CreateApiKeySchema } from "@/lib/validations/api-key";
import { FEATURES } from "@/lib/launch";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * GET /api/internal/api-keys
 * Lists registered API keys with backward-compatible name-title properties.
 */
export async function GET() {
  try {
    const { workspace, session, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");

    if (!FEATURES.enableApiKeyGeneration && !isAdminEmail(session.user.email)) {
      return apiError("FORBIDDEN", "This feature is not available yet.");
    }

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        scopes: true,
        environmentId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Inject title field dynamically for robust frontend compatibility
    const formattedKeys = keys.map((key) => ({
      ...key,
      title: key.name, // Compatibility map for UI elements expecting title
      key: `${key.keyPrefix}••••••••••••••••••••••••`, // Masked value fallback
    }));

    return apiSuccess(formattedKeys);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    console.error("Failed to list API keys:", err);
    return apiError("INTERNAL_ERROR", "Failed to retrieve API keys.");
  }
}

/**
 * POST /api/internal/api-keys
 * Generates a secure, cryptographically random API key. Returns raw token exactly once.
 */
export async function POST(req: NextRequest) {
  try {
    const { workspace, session, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");

    if (!FEATURES.enableApiKeyGeneration && !isAdminEmail(session.user.email)) {
      return apiError("FORBIDDEN", "This feature is not available yet.");
    }

    const body = await req.json();
    const parsed = CreateApiKeySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "Name is required.");
    }

    const { rawKey, key } = await ApiKeyService.createApiKey(
      workspace.id,
      parsed.data.name,
      session.user.id,
      parsed.data.scopes,
      parsed.data.environmentId
    );

    // Return raw key exclusively once
    return apiSuccess({
      key: rawKey,
      prefix: key.keyPrefix,
      name: key.name,
      title: key.name, // Compatibility map
      id: key.id,
      environmentId: key.environmentId,
      createdAt: key.createdAt,
      scopes: key.scopes,
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    console.error("API Key generation failed:", err);
    if (err.message?.startsWith("PLAN_LIMIT_REACHED")) {
      return apiError("PLAN_LIMIT_REACHED", "Maximum 5 API keys allowed.");
    }
    return apiError("INTERNAL_ERROR", "Failed to generate API Key.");
  }
}

/**
 * DELETE /api/internal/api-keys
 * Revokes access for a registered API key endpoint.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { workspace, session, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");

    if (!FEATURES.enableApiKeyGeneration && !isAdminEmail(session.user.email)) {
      return apiError("FORBIDDEN", "This feature is not available yet.");
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return apiError("INVALID_INPUT", "Key ID required.");
    }

    const result = await ApiKeyService.revokeApiKey(workspace.id, id, session.user.id);
    return apiSuccess(result);
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    console.error("API Key revocation failed:", err);
    if (err.message?.startsWith("NOT_FOUND")) {
      return apiError("NOT_FOUND", "API key not found.");
    }
    return apiError("INTERNAL_ERROR", "Failed to revoke API key.");
  }
}
