import { withApiAuth, requireScope } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export const GET = withApiAuth(
  requireScope("read:collections", async (req, { workspaceId, params }) => {
    try {
      const resolvedParams = await params;
      const slug = resolvedParams?.slug;
      const collection = await prisma.collection.findUnique({
        where: { workspaceId_slug: { workspaceId, slug } },
      });
      if (!collection) {
        return apiError("NOT_FOUND", `Collection "${slug}" not found.`);
      }
      return apiSuccess(collection);
    } catch {
      return apiError("INTERNAL_ERROR", "Failed to retrieve collection.");
    }
  })
);
