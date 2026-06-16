import { prisma } from "./prisma";
import { logAction } from "./audit";
import { logger } from "./logger";

export interface VerifyPreviewResult {
  allowed: boolean;
  errorResponse?: { status: number; message: string; code: string };
  token?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function verifyDraftPreview({
  tokenValue,
  workspaceId,
  collectionSlug,
  entrySlug,
  environmentId,
  ip,
  userAgent,
}: {
  tokenValue: string | null;
  workspaceId: string;
  collectionSlug: string;
  entrySlug?: string;
  environmentId?: string;
  ip?: string;
  userAgent?: string;
}): Promise<VerifyPreviewResult> {
  // If preview is requested but token is missing
  if (!tokenValue) {
    logger.warn(`Draft preview failed: Missing token`, { workspaceId, collectionSlug, entrySlug });
    await logAction({
      workspaceId,
      action: "DRAFT_TOKEN_FAILED",
      resourceType: "ENTRY",
      resourceId: entrySlug || collectionSlug,
      resourceName: entrySlug ? `${collectionSlug}/${entrySlug}` : collectionSlug,
      after: { reason: "missing_token" },
      ip,
      userAgent,
    });
    return {
      allowed: false,
      errorResponse: {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Draft preview requires a valid preview token.",
      },
    };
  }

  // Find the token
  const token = await prisma.draftToken.findUnique({
    where: { token: tokenValue },
  });

  if (!token) {
    logger.warn(`Draft preview failed: Invalid token "${tokenValue}"`, { workspaceId, collectionSlug, entrySlug });
    await logAction({
      workspaceId,
      action: "DRAFT_TOKEN_FAILED",
      resourceType: "ENTRY",
      resourceId: entrySlug || collectionSlug,
      resourceName: entrySlug ? `${collectionSlug}/${entrySlug}` : collectionSlug,
      after: { reason: "invalid_token", tokenValue },
      ip,
      userAgent,
    });
    return {
      allowed: false,
      errorResponse: {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Invalid preview token.",
      },
    };
  }

  // 1. Validate active
  if (!token.active) {
    logger.warn(`Draft preview failed: Revoked token "${tokenValue}"`, { workspaceId, collectionSlug, entrySlug });
    await logAction({
      workspaceId,
      action: "DRAFT_TOKEN_FAILED",
      resourceType: "ENTRY",
      resourceId: entrySlug || collectionSlug,
      resourceName: entrySlug ? `${collectionSlug}/${entrySlug}` : collectionSlug,
      after: { reason: "revoked_token", tokenId: token.id },
      ip,
      userAgent,
    });
    return {
      allowed: false,
      errorResponse: {
        status: 403,
        code: "FORBIDDEN",
        message: "Preview token is inactive/revoked.",
      },
    };
  }

  // 2. Validate workspace isolation
  if (token.workspaceId !== workspaceId) {
    logger.warn(`Draft preview failed: Workspace mismatch for token "${tokenValue}"`, {
      tokenWorkspaceId: token.workspaceId,
      requestWorkspaceId: workspaceId,
    });
    await logAction({
      workspaceId,
      action: "DRAFT_TOKEN_FAILED",
      resourceType: "ENTRY",
      resourceId: entrySlug || collectionSlug,
      resourceName: entrySlug ? `${collectionSlug}/${entrySlug}` : collectionSlug,
      after: { reason: "workspace_mismatch", tokenId: token.id },
      ip,
      userAgent,
    });
    return {
      allowed: false,
      errorResponse: {
        status: 403,
        code: "FORBIDDEN",
        message: "Preview token does not belong to this workspace.",
      },
    };
  }

  // 3. Validate environment isolation
  if (environmentId && token.environmentId && token.environmentId !== environmentId) {
    logger.warn(`Draft preview failed: Environment mismatch for token "${tokenValue}"`, {
      tokenEnvironmentId: token.environmentId,
      requestEnvironmentId: environmentId,
    });
    await logAction({
      workspaceId,
      action: "DRAFT_TOKEN_FAILED",
      resourceType: "ENTRY",
      resourceId: entrySlug || collectionSlug,
      resourceName: entrySlug ? `${collectionSlug}/${entrySlug}` : collectionSlug,
      after: { reason: "environment_mismatch", tokenId: token.id },
      ip,
      userAgent,
    });
    return {
      allowed: false,
      errorResponse: {
        status: 403,
        code: "FORBIDDEN",
        message: "Preview token environment mismatch.",
      },
    };
  }

  // 4. Validate expiration
  if (token.expiresAt && token.expiresAt < new Date()) {
    logger.warn(`Draft preview failed: Expired token "${tokenValue}"`, {
      tokenId: token.id,
      expiresAt: token.expiresAt,
    });
    await logAction({
      workspaceId,
      action: "DRAFT_TOKEN_FAILED",
      resourceType: "ENTRY",
      resourceId: entrySlug || collectionSlug,
      resourceName: entrySlug ? `${collectionSlug}/${entrySlug}` : collectionSlug,
      after: { reason: "expired_token", tokenId: token.id },
      ip,
      userAgent,
    });
    return {
      allowed: false,
      errorResponse: {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Preview token has expired.",
      },
    };
  }

  // Load collection to verify permissions
  const collection = await prisma.collection.findUnique({
    where: { workspaceId_slug: { workspaceId, slug: collectionSlug } },
  });

  if (!collection) {
    return {
      allowed: false,
      errorResponse: {
        status: 404,
        code: "NOT_FOUND",
        message: `Collection "${collectionSlug}" not found.`,
      },
    };
  }

  // 4. Validate collection permission
  if (token.allowedCollectionId && token.allowedCollectionId !== collection.id) {
    logger.warn(`Draft preview failed: Collection permission mismatch`, {
      tokenAllowedCollectionId: token.allowedCollectionId,
      requestedCollectionId: collection.id,
    });
    await logAction({
      workspaceId,
      action: "DRAFT_TOKEN_FAILED",
      resourceType: "ENTRY",
      resourceId: entrySlug || collectionSlug,
      resourceName: entrySlug ? `${collectionSlug}/${entrySlug}` : collectionSlug,
      after: { reason: "unauthorized_collection", tokenId: token.id },
      ip,
      userAgent,
    });
    return {
      allowed: false,
      errorResponse: {
        status: 403,
        code: "FORBIDDEN",
        message: "Preview token does not have permission for this collection.",
      },
    };
  }

  // 5. If entrySlug is provided, validate entry slug & permission
  if (entrySlug) {
    const entry = await prisma.entry.findUnique({
      where: {
        collectionId_slug: {
          collectionId: collection.id,
          slug: entrySlug,
        },
      },
    });

    if (!entry) {
      return {
        allowed: false,
        errorResponse: {
          status: 404,
          code: "NOT_FOUND",
          message: `Entry "${entrySlug}" not found.`,
        },
      };
    }

    // Validate entry permission
    if (token.allowedEntryId && token.allowedEntryId !== entry.id) {
      logger.warn(`Draft preview failed: Entry permission mismatch`, {
        tokenAllowedEntryId: token.allowedEntryId,
        requestedEntryId: entry.id,
      });
      await logAction({
        workspaceId,
        action: "DRAFT_TOKEN_FAILED",
        resourceType: "ENTRY",
        resourceId: entrySlug,
        resourceName: `${collectionSlug}/${entrySlug}`,
        after: { reason: "unauthorized_entry", tokenId: token.id },
        ip,
        userAgent,
      });
      return {
        allowed: false,
        errorResponse: {
          status: 403,
          code: "FORBIDDEN",
          message: "Preview token does not have permission for this entry.",
        },
      };
    }

    // 6. Validate environment matching
    if (token.environmentId && entry.environmentId && token.environmentId !== entry.environmentId) {
      logger.warn(`Draft preview failed: Environment mismatch`, {
        tokenEnvironmentId: token.environmentId,
        entryEnvironmentId: entry.environmentId,
      });
      await logAction({
        workspaceId,
        action: "DRAFT_TOKEN_FAILED",
        resourceType: "ENTRY",
        resourceId: entrySlug,
        resourceName: `${collectionSlug}/${entrySlug}`,
        after: { reason: "environment_mismatch", tokenId: token.id },
        ip,
        userAgent,
      });
      return {
        allowed: false,
        errorResponse: {
          status: 403,
          code: "FORBIDDEN",
          message: "Preview token environment mismatch.",
        },
      };
    }
  }

  // Record successful preview usage in the background (fire and forget)
  prisma.draftToken
    .update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  await logAction({
    workspaceId,
    action: "DRAFT_TOKEN_USED",
    resourceType: "ENTRY",
    resourceId: entrySlug || collectionSlug,
    resourceName: entrySlug ? `${collectionSlug}/${entrySlug}` : collectionSlug,
    after: { tokenId: token.id, tokenName: token.name },
    ip,
    userAgent,
  });

  return {
    allowed: true,
    token,
  };
}
