import { withApiAuth, requireScope } from "@/middleware/with-api-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

export const GET = withApiAuth(
  requireScope("admin:workspace", async (req, { workspaceId }) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      if (!workspace) {
        return apiError("NOT_FOUND", "Workspace not found.");
      }
      return apiSuccess(workspace);
    } catch {
      return apiError("INTERNAL_ERROR", "Failed to retrieve workspace.");
    }
  })
);
