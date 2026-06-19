import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/internal/media/folders
 * Returns all media folders in the workspace.
 */
export async function GET() {
  let workspace;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const folders = await prisma.mediaFolder.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
    });
    return apiSuccess(folders);
  } catch (err) {
    logger.error("Failed to list media folders", { error: err, workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined });
    return apiError("INTERNAL_ERROR", "Failed to retrieve media folders.");
  }
}

/**
 * POST /api/internal/media/folders
 * Creates a new media folder.
 */
export async function POST(req: NextRequest) {
  let workspace;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { role } = sessionRes;
    await requireRole(role, "ADMIN");

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
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Failed to create media folder", { error: err, workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined });
    return apiError("INTERNAL_ERROR", "Failed to create media folder.");
  }
}
