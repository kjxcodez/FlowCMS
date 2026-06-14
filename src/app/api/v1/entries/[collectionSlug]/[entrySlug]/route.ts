import { withApiAuth } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { verifyDraftPreview } from "@/lib/preview";

export const runtime = "nodejs";

export const GET = withApiAuth(async (req, { workspaceId, params }) => {
  const resolvedParams = await params;
  const entrySlug = resolvedParams?.entrySlug || req.nextUrl.pathname.split("/").at(-1)!;
  const collectionSlug = resolvedParams?.collectionSlug || req.nextUrl.pathname.split("/").at(-2)!;

  const collection = await prisma.collection.findUnique({
    where: { workspaceId_slug: { workspaceId, slug: collectionSlug } },
  });

  if (!collection) {
    return apiError("NOT_FOUND", `Collection "${collectionSlug}" not found.`);
  }

  const entry = await prisma.entry.findUnique({
    where: {
      collectionId_slug: {
        collectionId: collection.id,
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
      ip: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    if (!previewResult.allowed) {
      // If the entry is published, it remains accessible publicly regardless of token check failure
      if (entry.status !== "PUBLISHED") {
        return apiError(
          previewResult.errorResponse!.code as any,
          previewResult.errorResponse!.message
        );
      }
    }
  }

  return apiSuccess(entry);
});
