import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";

export const runtime = "nodejs";

/**
 * GET /api/internal/media/folders
 * Returns all media folders in the workspace.
 */
export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const folders = await prisma.mediaFolder.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
    });
    return apiSuccess(folders);
  } catch (err) {
    console.error("Failed to list media folders:", err);
    return apiError("INTERNAL_ERROR", "Failed to retrieve media folders.");
  }
}

/**
 * POST /api/internal/media/folders
 * Creates a new media folder.
 */
export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await req.json();
    const { name, parentId } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return apiError("INVALID_INPUT", "Folder name is required.");
    }

    const folder = await prisma.mediaFolder.create({
      data: {
        workspaceId: workspace.id,
        name: name.trim(),
        parentId: parentId || null,
      },
    });

    return apiSuccess(folder);
  } catch (err) {
    console.error("Failed to create media folder:", err);
    return apiError("INTERNAL_ERROR", "Failed to create media folder.");
  }
}
