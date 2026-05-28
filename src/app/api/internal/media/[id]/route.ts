import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { MediaService } from "@/server/services/media.service";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

/**
 * DELETE /api/internal/media/[id]
 * Deletes a media asset from both the database catalog and physical storage.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireWorkspace();
    const { id } = await params;

    if (!id) {
      return apiError("INVALID_INPUT", "No media asset ID provided.");
    }

    const result = await MediaService.deleteMedia(workspace.id, id);
    return apiSuccess(result);
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Internal Media deletion exception:", err);
    if (err.message?.startsWith("NOT_FOUND")) {
      return apiError("NOT_FOUND", "Media asset not found in this workspace.");
    }
    return apiError("INTERNAL_ERROR", "Failed to delete media asset.");
  }
}
