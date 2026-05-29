import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { MediaService } from "@/server/services/media.service";

export const runtime = "nodejs";

/**
 * POST /api/internal/media/bulk
 * Perform bulk operations: 'move' or 'delete'.
 */
export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await req.json();
    const { ids, action, targetFolderId } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return apiError("INVALID_INPUT", "No media asset IDs provided.");
    }

    // Perform operations
    if (action === "move") {
      const targetFolder = targetFolderId
        ? await prisma.mediaFolder.findFirst({
            where: { id: targetFolderId, workspaceId: workspace.id },
          })
        : null;

      // If they passed a target folder and it wasn't found, return error
      if (targetFolderId && !targetFolder) {
        return apiError("INVALID_INPUT", "Target folder not found in workspace.");
      }

      await prisma.media.updateMany({
        where: {
          id: { in: ids },
          workspaceId: workspace.id,
        },
        data: {
          folderId: targetFolderId || null,
        },
      });

      return apiSuccess({ moved: ids.length });
    }

    if (action === "delete") {
      let successCount = 0;
      for (const id of ids) {
        try {
          await MediaService.deleteMedia(workspace.id, id);
          successCount++;
        } catch (err) {
          console.error(`Bulk deletion failed for media ID ${id}:`, err);
        }
      }
      return apiSuccess({ deleted: successCount });
    }

    return apiError("INVALID_INPUT", "Unsupported bulk action. Use 'move' or 'delete'.");
  } catch (err) {
    console.error("Bulk media operation exception:", err);
    return apiError("INTERNAL_ERROR", "Failed to execute bulk operation.");
  }
}
