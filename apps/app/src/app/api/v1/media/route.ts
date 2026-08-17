import { withApiAuth, requireScope } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export const GET = withApiAuth(
  requireScope("read:media", async (req, { workspaceId }) => {
    try {
      const media = await prisma.media.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
      });
      return apiSuccess(media);
    } catch {
      return apiError("INTERNAL_ERROR", "Failed to retrieve media.");
    }
  })
);
