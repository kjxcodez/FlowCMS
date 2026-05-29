import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { emitPlatformEvent, PLATFORM_EVENTS } from "../events/emitter";
import { incrementStorageUsage, decrementStorageUsage } from "@/lib/usage";


export interface MediaUploadParams {
  workspaceId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  folderId?: string | null;
  title?: string | null;
  caption?: string | null;
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
        folderId: params.folderId || null,
        title: params.title || null,
        caption: params.caption || null,
      },
    });

    // Dynamically increment active workspace storage consumption
    await incrementStorageUsage(params.workspaceId, params.size);

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
    }

    // 3. Database deletion
    await prisma.media.delete({
      where: { id },
    });

    // Dynamically decrement active workspace storage consumption
    await decrementStorageUsage(workspaceId, media.size);

    emitPlatformEvent(PLATFORM_EVENTS.MEDIA_DELETED, {
      workspaceId,
      mediaId: id,
    });

    return { deleted: true };
  }

  /**
   * Performs high-reliability bulk deletion: aggregates combined sizes,
   * performs physical deletions, executes a single prisma.media.deleteMany,
   * and dispatches a single atomic decrement of storage usage.
   */
  static async bulkDeleteMedia(workspaceId: string, ids: string[]) {
    // 1. Fetch metadata for all target media
    const mediaItems = await prisma.media.findMany({
      where: {
        id: { in: ids },
        workspaceId,
      },
    });

    if (mediaItems.length === 0) {
      return { deleted: 0 };
    }

    // 2. Aggregate sizes for a single atomic decrement
    const totalSize = mediaItems.reduce((sum, item) => sum + item.size, 0);

    // 3. Physical cleanup in parallel
    await Promise.all(
      mediaItems.map(async (media) => {
        const urlParts = media.url.split("/media/");
        let storagePath = urlParts.length > 1 ? urlParts[1] : `${media.workspaceId}/${media.filename}`;
        if (storagePath.includes("?")) {
          storagePath = storagePath.split("?")[0];
        }

        try {
          await storage.delete(storagePath);
        } catch (err) {
          console.error(`Physical bulk media deletion failed for path ${storagePath}:`, err);
        }
      })
    );

    // 4. Atomic database deletion
    await prisma.media.deleteMany({
      where: {
        id: { in: ids },
        workspaceId,
      },
    });

    // 5. Atomic storage usage decrement
    await decrementStorageUsage(workspaceId, totalSize);

    // 6. Emit platform events
    mediaItems.forEach((media) => {
      emitPlatformEvent(PLATFORM_EVENTS.MEDIA_DELETED, {
        workspaceId,
        mediaId: media.id,
      });
    });

    return { deleted: mediaItems.length };
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

  /**
   * Scan entry data to track references of a media item in the workspace.
   */
  static async getMediaUsage(workspaceId: string, mediaId: string, mediaUrl: string) {
    const entries = await prisma.entry.findMany({
      where: { workspaceId },
      include: {
        collection: true,
      },
    });

    const usages: { type: string; name: string; id: string }[] = [];

    for (const entry of entries) {
      const dataStr = JSON.stringify(entry.data);
      // Scan for media ID or public URL in JSON data to capture any usage
      if (dataStr.includes(mediaId) || dataStr.includes(mediaUrl)) {
        usages.push({
          type: entry.collection.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (entry.data as any)?.title || (entry.data as any)?.name || entry.slug,
          id: entry.id,
        });
      }
    }

    return usages;
  }
}
