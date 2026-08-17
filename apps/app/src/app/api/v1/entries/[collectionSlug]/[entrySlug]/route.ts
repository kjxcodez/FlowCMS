import { withApiAuth, requireScope } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { verifyDraftPreview } from "@/lib/preview";

export const runtime = "nodejs";

export const GET = withApiAuth(
  requireScope("read:entries", async (req, { workspaceId, environmentId, params }) => {
    const resolvedParams = await params;
    const entrySlug = resolvedParams?.entrySlug || req.nextUrl.pathname.split("/").at(-1)!;
    const collectionSlug = resolvedParams?.collectionSlug || req.nextUrl.pathname.split("/").at(-2)!;

    const collection = await prisma.collection.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: collectionSlug } },
    });

    if (!collection) {
      return apiError("NOT_FOUND", `Collection "${collectionSlug}" not found.`);
    }

    if (!environmentId) {
      return apiError("UNAUTHORIZED", "API key is not bound to an environment.");
    }

    const entry = await prisma.entry.findUnique({
      where: {
        collectionId_environmentId_slug: {
          collectionId: collection.id,
          environmentId,
          slug: entrySlug,
        },
      },
    });

    if (!entry) {
      return apiError("NOT_FOUND", `Entry "${entrySlug}" not found in collection "${collectionSlug}".`);
    }

    // Only return published entries by default
    const { searchParams } = req.nextUrl;
    const includeDrafts = searchParams.get("preview") === "true";

    if (entry.status !== "PUBLISHED" && !includeDrafts) {
      return apiError("NOT_FOUND", `Entry "${entrySlug}" is not published.`);
    }

    if (includeDrafts) {
      const previewToken = searchParams.get("token") || searchParams.get("_token") || req.headers.get("x-draft-token");
      const previewResult = await verifyDraftPreview({
        tokenValue: previewToken,
        workspaceId,
        collectionSlug,
        entrySlug,
        environmentId,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      if (!previewResult.allowed) {
        // If the entry is published, it remains accessible publicly regardless of token check failure
        if (entry.status !== "PUBLISHED") {
          return apiError(
            previewResult.errorResponse!.code as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            previewResult.errorResponse!.message
          );
        }
      }
    }

    return apiSuccess(entry);
  })
);
