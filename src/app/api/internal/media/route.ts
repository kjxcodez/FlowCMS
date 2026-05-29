import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { apiError, apiSuccess } from "@/types/api";
import { MediaService } from "@/server/services/media.service";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/internal/media
 * Lists all registered assets for the authenticated workspace.
 * Supports:
 * - ?folderId=[id] (folders filter, or 'root' for null)
 * - ?q=[search] (recursive string match on name, alt, captions, folders)
 */
export async function GET(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
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
          folderRelation: {
            name: { contains: q, mode: "insensitive" },
          },
        },
      ];
    }

    const media = await prisma.media.findMany({
      where: whereClause,
      include: {
        folderRelation: true,
      },
      orderBy: { createdAt: "desc" },
    });

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
    const folderId = formData.get("folderId") as string | null;

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
      folderId: folderId || null,
    });

    return apiSuccess(media);
  } catch (err) {
    console.error("Internal media upload failure:", err);
    return apiError("INTERNAL_ERROR", "Unexpected upload system failure.");
  }
}
