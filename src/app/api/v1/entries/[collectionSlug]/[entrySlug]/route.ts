import { withApiAuth } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export const GET = withApiAuth(async (req, { workspaceId }) => {
  const parts = req.nextUrl.pathname.split("/");
  const entrySlug = parts.at(-1)!;
  const collectionSlug = parts.at(-2)!;

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

  return apiSuccess(entry);
});
