import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

/**
 * PATCH /api/internal/media/folders/[id]
 * Renames or relocates a folder. Includes recursive cycle detection.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");
    const { id } = await params;
    const body = await req.json();
    const { name, parentId } = body;

    // Verify folder exists and belongs to workspace
    const existing = await prisma.mediaFolder.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!existing) {
      return apiError("NOT_FOUND", "Folder not found.");
    }

    // Cycle detection
    if (parentId !== undefined && parentId !== null) {
      if (parentId === id) {
        return apiError("INVALID_INPUT", "Cannot move a folder inside itself.");
      }

      // Check if parentId is a descendant of id
      let currentParentId: string | null = parentId;
      while (currentParentId) {
        const parentFolder = await prisma.mediaFolder.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });
        if (!parentFolder) break;
        if (parentFolder.parentId === id) {
          return apiError("INVALID_INPUT", "Cannot move a folder inside one of its descendants.");
        }
        currentParentId = parentFolder.parentId;
      }
    }

    const updated = await prisma.mediaFolder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(parentId !== undefined && { parentId: parentId || null }),
      },
    });

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    console.error("Failed to update media folder:", err);
    return apiError("INTERNAL_ERROR", "Failed to update media folder.");
  }
}

/**
 * DELETE /api/internal/media/folders/[id]
 * Deletes a folder based on deletion policies (Option A: empty, Option B: move).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");
    const { id } = await params;
    
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "move"; // Default Option B: move contents

    const folder = await prisma.mediaFolder.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!folder) {
      return apiError("NOT_FOUND", "Folder not found.");
    }

    // Option A: Delete only if empty
    if (mode === "empty") {
      const mediaCount = await prisma.media.count({ where: { folderId: id } });
      const childFoldersCount = await prisma.mediaFolder.count({ where: { parentId: id } });
      if (mediaCount > 0 || childFoldersCount > 0) {
        return apiError("INVALID_INPUT", "Folder is not empty. Cannot delete with mode 'empty'.");
      }

      await prisma.mediaFolder.delete({ where: { id } });
      return apiSuccess({ deleted: true });
    }

    // Option B: Move contents to parent of the deleted folder, then delete
    const targetParentId = folder.parentId; // Move to parent (or null for root)

    // Move all media in this folder to the target parent folder
    await prisma.media.updateMany({
      where: { folderId: id, workspaceId: workspace.id },
      data: { folderId: targetParentId },
    });

    // Move all child folders of this folder to the target parent folder
    await prisma.mediaFolder.updateMany({
      where: { parentId: id, workspaceId: workspace.id },
      data: { parentId: targetParentId },
    });

    // Delete the now empty folder
    await prisma.mediaFolder.delete({ where: { id } });

    return apiSuccess({ deleted: true, movedTo: targetParentId || "root" });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    console.error("Failed to delete media folder:", err);
    return apiError("INTERNAL_ERROR", "Failed to delete media folder.");
  }
}
