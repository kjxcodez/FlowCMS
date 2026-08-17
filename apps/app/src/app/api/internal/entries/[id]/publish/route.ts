import { NextRequest } from "next/server";
import { requireWorkspace, requireRole, ForbiddenError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/types/api";
import { dispatchWebhooks } from "@/lib/webhooks";
import { purgeCacheTags } from "@/lib/cloudflare";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, role } = await requireWorkspace();
    await requireRole(role, "ADMIN");
    const { id } = await params;

    const entry = await prisma.entry.findFirst({
      where: { id, collection: { workspaceId: workspace.id } },
    });

    if (!entry) return apiError("NOT_FOUND", "Entry not found.");

    const updated = await prisma.entry.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Revalidate tags and purge cache
    purgeCacheTags([`ws:${workspace.id}`, `entry:${id}`]).catch(() => {});
    
    dispatchWebhooks(workspace.id, "ENTRY_PUBLISHED", {
      entryId: updated.id,
    }).catch(() => {});

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return apiError("FORBIDDEN", err.message);
    }
    return apiError("INTERNAL_ERROR", "Failed to publish entry.");
  }
}
