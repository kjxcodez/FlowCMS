import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { MediaService } from "@/server/services/media.service";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

/**
 * GET /api/internal/media/[id]/usage
 * Returns a list of all workspace entries referencing a media asset's ID or URL.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireWorkspace();
    const { id } = await params;

    const media = await MediaService.getMedia(workspace.id, id);
    if (!media) {
      return apiError("NOT_FOUND", "Media asset not found.");
    }

    const usages = await MediaService.getMediaUsage(workspace.id, media.id, media.url);
    return apiSuccess(usages);
  } catch (err) {
    console.error("Failed to query media usage references:", err);
    return apiError("INTERNAL_ERROR", "Failed to retrieve media usage records.");
  }
}
