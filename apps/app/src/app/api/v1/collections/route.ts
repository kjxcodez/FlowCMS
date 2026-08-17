import { withApiAuth, requireScope } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export const GET = withApiAuth(
  requireScope("read:collections", async (req, { workspaceId }) => {
    try {
      const collections = await prisma.collection.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
      });
      return apiSuccess(collections);
    } catch {
      return apiError("INTERNAL_ERROR", "Failed to retrieve collections.");
    }
  })
);
