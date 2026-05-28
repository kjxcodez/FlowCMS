import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { emitPlatformEvent, PLATFORM_EVENTS } from "../events/emitter";

export interface MediaUploadParams {
  workspaceId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export class MediaService {
  /**
   * List all media assets for a workspace.
   */
  static async listMedia(workspaceId: string) {
    return await prisma.media.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get specific media asset.
   */
  static async getMedia(workspaceId: string, id: string) {
    return await prisma.media.findFirst({
      where: { id, workspaceId },
    });
  }

  /**
   * Registers a successfully uploaded asset inside the Postgres catalog.
   */
  static async createMediaRecord(params: MediaUploadParams) {
    const media = await prisma.media.create({
      data: {
        workspaceId: params.workspaceId,
        filename: params.filename,
        url: params.url,
        mimeType: params.mimeType,
        size: params.size,
      },
    });

    emitPlatformEvent(PLATFORM_EVENTS.MEDIA_UPLOADED, {
      workspaceId: params.workspaceId,
      mediaId: media.id,
      filename: media.filename,
    });

    return media;
  }

  /**
   * Safely deletes a media row and clean up physical files via the swappable storage layer.
   */
  static async deleteMedia(workspaceId: string, id: string) {
    const media = await prisma.media.findFirst({
      where: { id, workspaceId },
    });

    if (!media) {
      throw new Error("NOT_FOUND: Media asset not found.");
    }

    // 1. Extract physical path from public URL or parse stored path format
    // In our Storage Layer, we return both the URL and the original file path.
    // If the path format isn't stored separately in the DB (it is typically in the URL or folders),
    // we can parse it from the public URL or look for specific substrings.
    // However, our unified storage upload saves a clear folder path relative to the bucket.
    // For Supabase, the path is workspaceId/filename.
    // Let's deduce the storage path from the URL.
    const urlParts = media.url.split("/media/");
    let storagePath = urlParts.length > 1 ? urlParts[1] : `${media.workspaceId}/${media.filename}`;
    
    // Fallback parsing for general paths
    if (storagePath.includes("?")) {
      storagePath = storagePath.split("?")[0];
    }
    
    // 2. Physical storage deletion
    try {
      await storage.delete(storagePath);
    } catch (err) {
      console.error(`Physical media deletion failed for path ${storagePath}:`, err);
      // We can proceed to clean up DB even if storage failed to avoid listing deadlock,
      // or bubble it up depending on strictness. Here we log and proceed to protect platform state.
    }

    // 3. Database deletion
    await prisma.media.delete({
      where: { id },
    });

    emitPlatformEvent(PLATFORM_EVENTS.MEDIA_DELETED, {
      workspaceId,
      mediaId: id,
    });

    return { deleted: true };
  }

  /**
   * Aggregates total storage bytes consumption and count.
   */
  static async getMediaStats(workspaceId: string) {
    const [count, aggregate] = await Promise.all([
      prisma.media.count({
        where: { workspaceId },
      }),
      prisma.media.aggregate({
        where: { workspaceId },
        _sum: { size: true },
      }),
    ]);

    return {
      count,
      totalBytes: aggregate._sum.size ?? 0,
    };
  }
}
