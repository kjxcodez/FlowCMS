import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { apiError, apiSuccess } from "@/types/api";
import { MediaService } from "@/server/services/media.service";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { checkStorageLimit } from "@/lib/usage";
import { isAdminEmail } from "@/lib/admin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/internal/media
 * Lists all registered assets for the authenticated workspace.
 * Supports:
 * - ?folderId=[id] (folders filter, or 'root' for null)
 * - ?q=[search] (recursive string match on name, alt, captions, folders)
 */
export async function GET(req: NextRequest) {
  let workspace;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const url = new URL(req.url);
    const folderId = url.searchParams.get("folderId");
    const q = url.searchParams.get("q");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      workspaceId: workspace.id,
    };

    // Filter by folder if specified
    if (folderId !== null && folderId !== "") {
      if (folderId === "root") {
        whereClause.folderId = null;
      } else {
        whereClause.folderId = folderId;
      }
    }

    // Search matches recursively (includes filenames, alt, mime, or folder name matches)
    if (q) {
      whereClause.OR = [
        { filename: { contains: q, mode: "insensitive" } },
        { mimeType: { contains: q, mode: "insensitive" } },
        { alt: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { caption: { contains: q, mode: "insensitive" } },
        {
          folder: {
            name: { contains: q, mode: "insensitive" },
          },
        },
      ];
    }

    const media = await prisma.media.findMany({
      where: whereClause,
      include: {
        folder: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(media);
  } catch (err) {
    logger.error("Failed to list media assets", { error: err, workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined });
    return apiError("INTERNAL_ERROR", "Failed to retrieve media library.");
  }
}

/**
 * POST /api/internal/media
 * Uploads an asset via the unified Storage abstraction and registers it in the database.
 */
export async function POST(req: NextRequest) {
  let workspace;
  try {
    const sessionRes = await requireWorkspace();
    workspace = sessionRes.workspace;
    const { session, role } = sessionRes;
    await requireRole(role, "EDITOR");
    const formData = await req.formData();
    const files = formData.getAll("file").filter((val): val is File => val instanceof File);
    const folderId = formData.get("folderId") as string | null;

    if (files.length === 0) {
      return apiError("INVALID_INPUT", "No file uploaded.");
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return apiError("INVALID_INPUT", "File size exceeds the 10MB boundary.");
      }
    }

    const totalIncomingSize = files.reduce((acc, f) => acc + f.size, 0);

    const limit = await checkStorageLimit(
      workspace.id,
      workspace.plan,
      totalIncomingSize,
      isAdminEmail(session.user.email)
    );
    if (!limit.allowed) {
      return apiError("STORAGE_LIMIT_REACHED", "Your workspace has reached its storage limit.");
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastMediaRecord: any = null;

    for (const file of files) {
      // 1. Storage Provider Upload
      const { url } = await storage.upload(workspace.id, file);

      // 2. Database Catalog Entry via Media Service
      lastMediaRecord = await MediaService.createMediaRecord({
        workspaceId: workspace.id,
        filename: file.name,
        url,
        mimeType: file.type,
        size: file.size,
        folderId: folderId || null,
      });
    }

    return apiSuccess(lastMediaRecord);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    logger.error("Internal media upload failure", { error: err, workspaceId: typeof workspace !== "undefined" ? workspace.id : undefined });
    return apiError("INTERNAL_ERROR", "Unexpected upload system failure.");
  }
}
