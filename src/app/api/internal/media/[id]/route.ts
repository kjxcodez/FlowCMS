import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { MediaService } from "@/server/services/media.service";
import { apiError, apiSuccess } from "@/types/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * PATCH /api/internal/media/[id]
 * Updates metadata (alt, title, caption, folderId) for a media asset.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireWorkspace();
    const { id } = await params;
    const body = await req.json();
    const { title, alt, caption, folderId } = body;

    const media = await prisma.media.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!media) {
      return apiError("NOT_FOUND", "Media asset not found.");
    }

    // Verify folder exists in workspace if relocating
    if (folderId) {
      const folderExists = await prisma.mediaFolder.findFirst({
        where: { id: folderId, workspaceId: workspace.id },
      });
      if (!folderExists) {
        return apiError("INVALID_INPUT", "Target folder not found in workspace.");
      }
    }

    const updated = await prisma.media.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(alt !== undefined && { alt }),
        ...(caption !== undefined && { caption }),
        ...(folderId !== undefined && { folderId: folderId || null }),
      },
    });

    return apiSuccess(updated);
  } catch (err) {
    console.error("Failed to update media asset:", err);
    return apiError("INTERNAL_ERROR", "Failed to update media asset.");
  }
}

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
