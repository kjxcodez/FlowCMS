import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { apiError, apiSuccess } from "@/types/api";
import { MediaService } from "@/server/services/media.service";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * GET /api/internal/media
 * Lists all registered assets for the authenticated workspace.
 */
export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const media = await MediaService.listMedia(workspace.id);
    return apiSuccess(media);
  } catch (err) {
    console.error("Failed to list media:", err);
    return apiError("INTERNAL_ERROR", "Failed to retrieve media library.");
  }
}

/**
 * POST /api/internal/media
 * Uploads an asset via the unified Storage abstraction and registers it in the database.
 */
export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return apiError("INVALID_INPUT", "No file uploaded.");
    }

    if (file.size > 10 * 1024 * 1024) {
      return apiError("INVALID_INPUT", "File size exceeds the 10MB boundary.");
    }

    // 1. Storage Provider Upload
    const { url } = await storage.upload(workspace.id, file);

    // 2. Database Catalog Entry via Media Service
    const media = await MediaService.createMediaRecord({
      workspaceId: workspace.id,
      filename: file.name,
      url,
      mimeType: file.type,
      size: file.size,
    });

    return apiSuccess(media);
  } catch (err) {
    console.error("Internal media upload failure:", err);
    return apiError("INTERNAL_ERROR", "Unexpected upload system failure.");
  }
}
